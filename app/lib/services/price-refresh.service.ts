import "server-only";

import type { Selectable } from "kysely";

import { sql } from "@/app/lib/db";
import type { DB } from "@/app/lib/db-types";
import { isSupportedCryptoSymbol } from "@/app/lib/crypto-assets";
import {
  chunkList,
  collectRefreshPrices,
  normalizeSymbols,
  normalizeWalletAddresses,
} from "@/app/lib/price-refresh";
import { getCryptoPrices } from "@/app/api/crypto/price/service";
import { getWalletBalanceUsd } from "@/app/api/crypto/wallet/service";
import { isEthAddress } from "@/app/api/crypto/wallet/utils";
import { getYahooQuotes } from "@/app/api/stocks/price/service";
import { mapYahooQuotesToPrices } from "@/app/api/stocks/price/utils";

type AssetRow = Selectable<DB["assets"]> & { refresh_started_at: string };
type RefreshResult = { updated: number; skipped: number; failed: number };

const updatePrices = async (
  kind: "stock" | "crypto" | "wallet",
  prices: Record<string, number>,
  startedAt: string,
): Promise<void> => {
  const entries = Object.entries(prices);
  if (entries.length === 0) return;
  const values = entries
    .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
    .join(", ");
  const params = entries.flatMap(([key, price]) => [
    key,
    Math.round(price * 100),
  ]);
  // Match the current identity, so a response for an edited-away address cannot overwrite it.
  const identity =
    kind === "wallet"
      ? "CASE WHEN btrim(a.wallet_address) LIKE '0x%' THEN lower(btrim(a.wallet_address)) ELSE btrim(a.wallet_address) END"
      : "upper(btrim(a.ticker_symbol))";
  await sql.query(
    `
    UPDATE assets AS a
    SET value_cents = v.value_cents::bigint,
        price_updated_at = $${params.length + 2}::timestamptz
        ${kind === "wallet" ? ", quantity = 1" : ""}
    FROM (VALUES ${values}) AS v(identity, value_cents)
    WHERE a.kind = $${params.length + 1}
      AND ${identity} = v.identity
      AND a.price_updated_at < $${params.length + 2}::timestamptz
      AND a.updated_at < $${params.length + 2}::timestamptz
  `,
    [...params, kind, startedAt],
  );
};

const refreshPrices = async (userId: string): Promise<RefreshResult> => {
  const raw = process.env.PRICE_REFRESH_SECONDS;
  const refreshSeconds = raw ? Number.parseInt(raw, 10) : 3600;
  const hasRefreshLimit = Number.isFinite(refreshSeconds) && refreshSeconds > 0;
  const assets = (await sql.query(
    `
    SELECT *, now() AS refresh_started_at FROM assets
    WHERE user_id = $1 AND kind <> 'manual'
      ${hasRefreshLimit ? "AND price_updated_at < now() - ($2::double precision * interval '1 second')" : ""}
  `,
    hasRefreshLimit ? [userId, refreshSeconds] : [userId],
  )) as AssetRow[];
  if (assets.length === 0) return { updated: 0, skipped: 0, failed: 0 };
  // Use database time, not application-server clocks, to order overlapping refreshes.
  const startedAt = assets[0].refresh_started_at;

  const stockSymbols = normalizeSymbols(
    assets.filter((a) => a.kind === "stock").map((a) => a.ticker_symbol),
  );
  // TODO: Restore SOL/S/MON and other unsupported assets only with verified Ankr pricing.
  const cryptoSymbols = normalizeSymbols(
    assets.filter((a) => a.kind === "crypto").map((a) => a.ticker_symbol),
  ).filter(isSupportedCryptoSymbol);
  const walletAddresses = normalizeWalletAddresses(
    assets
      .filter((a) => a.kind === "wallet")
      .map((a) => a.wallet_address ?? ""),
  );
  const apiKey = process.env.ANKR_API_KEY;
  if ((cryptoSymbols.length || walletAddresses.length) && !apiKey?.trim()) {
    throw new Error("Missing ANKR_API_KEY");
  }

  const stocks: { prices: Record<string, number>; failed: string[] } = {
    prices: {},
    failed: [],
  };
  for (const batch of chunkList(stockSymbols, 50)) {
    let prices: Record<string, number>;
    try {
      prices = mapYahooQuotesToPrices(await getYahooQuotes(batch));
    } catch {
      stocks.failed.push(...batch);
      continue;
    }
    const result = await collectRefreshPrices(
      batch,
      async (symbol) => prices[symbol],
    );
    Object.assign(stocks.prices, result.prices);
    stocks.failed.push(...result.failed);
  }
  await updatePrices("stock", stocks.prices, startedAt);
  const crypto = await collectRefreshPrices(cryptoSymbols, async (symbol) => {
    const prices = await getCryptoPrices([symbol], apiKey ?? "");
    return prices[symbol];
  });
  await updatePrices("crypto", crypto.prices, startedAt);
  const wallets = await collectRefreshPrices(walletAddresses, (address) =>
    getWalletBalanceUsd(address, apiKey ?? ""),
  );
  await updatePrices("wallet", wallets.prices, startedAt);

  let updated = 0;
  let failed = 0;
  for (const asset of assets) {
    const result =
      asset.kind === "stock"
        ? stocks
        : asset.kind === "crypto"
          ? crypto
          : asset.kind === "wallet"
            ? wallets
            : null;
    const address = asset.wallet_address?.trim() ?? "";
    const key =
      asset.kind === "wallet"
        ? isEthAddress(address)
          ? address.toLowerCase()
          : address
        : asset.ticker_symbol.trim().toUpperCase();
    if (result && Object.hasOwn(result.prices, key)) updated++;
    else if (result?.failed.includes(key)) failed++;
  }
  return { updated, failed, skipped: assets.length - updated - failed };
};

// Coalesce overlapping page/button refreshes within this server instance.
const pendingRefreshes = new Map<string, Promise<RefreshResult>>();
export const refreshAssetPricesForUser = (
  userId: string,
): Promise<RefreshResult> => {
  const pending = pendingRefreshes.get(userId);
  if (pending) return pending;
  const promise = refreshPrices(userId).finally(() =>
    pendingRefreshes.delete(userId),
  );
  pendingRefreshes.set(userId, promise);
  return promise;
};
