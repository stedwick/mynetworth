import "server-only";

import type { Selectable } from "kysely";

import { sql } from "@/app/lib/db";
import type { DB } from "@/app/lib/db-types";
import {
  isValidCryptoSymbol,
  usesAnkrCryptoPrice,
} from "@/app/lib/crypto-assets";
import {
  chunkList,
  collectRefreshPrices,
  normalizeSymbols,
  normalizeWalletAddresses,
} from "@/app/lib/price-refresh";
import { getCryptoPrices } from "@/app/api/crypto/price/service";
import { getWalletBalanceUsd } from "@/app/api/crypto/wallet/service";
import {
  isEthAddress,
  isBtcAddress,
  isSolAddress,
  abbreviateWalletAddress,
  isSupportedWalletAddress,
} from "@/app/api/crypto/wallet/utils";
import { getYahooQuotes } from "@/app/api/stocks/price/service";
import { mapYahooQuotesToPrices } from "@/app/api/stocks/price/utils";
import { logFinance } from "@/app/lib/finance-log";
import { getHyperliquidBalanceUsd } from "@/app/lib/services/hyperliquid.service";

type AssetRow = Selectable<DB["assets"]> & {
  refresh_started_at: string;
  refresh_due: boolean;
};
type RefreshResult = {
  updated: number;
  skipped: number;
  failed: number;
  hyperliquidFailed?: number;
};

const updatePrices = async (
  kind: "stock" | "crypto" | "wallet",
  prices: Record<string, number>,
  startedAt: string,
  userId: string,
  walletIds: string[] = [],
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
      ${kind === "wallet" ? `AND a.user_id = $${params.length + 3} AND a.id = ANY($${params.length + 4}::uuid[])` : ""}
  `,
    [
      ...params,
      kind,
      startedAt,
      ...(kind === "wallet" ? [userId, walletIds] : []),
    ],
  );
};

const refreshPrices = async (userId: string): Promise<RefreshResult> => {
  const raw = process.env.PRICE_REFRESH_SECONDS;
  const refreshSeconds = raw ? Number.parseInt(raw, 10) : 3600;
  const hasRefreshLimit = Number.isFinite(refreshSeconds) && refreshSeconds > 0;
  const storedAssets = (await sql.query(
    `
    SELECT *, now() AS refresh_started_at,
      ${hasRefreshLimit ? "price_updated_at < now() - ($2::double precision * interval '1 second')" : "true"} AS refresh_due
    FROM assets
    WHERE user_id = $1 AND kind <> 'manual'
  `,
    hasRefreshLimit ? [userId, refreshSeconds] : [userId],
  )) as AssetRow[];
  for (const asset of storedAssets) {
    const address = asset.wallet_address?.trim() ?? "";
    const supported =
      asset.kind === "wallet"
        ? isSupportedWalletAddress(address)
        : asset.kind === "crypto"
          ? isValidCryptoSymbol(asset.ticker_symbol)
          : true;
    if (supported && asset.refresh_due) continue;
    const label =
      asset.kind === "wallet"
        ? `${isBtcAddress(address) ? "BTC" : isEthAddress(address) ? "ETH/EVM" : isSolAddress(address) ? "SOL" : "unsupported"} wallet ${abbreviateWalletAddress(address)}${!isBtcAddress(address) && isSolAddress(address) ? " (SOL only)" : ""}`
        : `${asset.ticker_symbol.trim().toUpperCase()} ${asset.kind === "stock" ? "stock" : "crypto"} price`;
    logFinance(
      "skip",
      supported
        ? `Skipping ${label}: its saved price is still fresh (refresh interval: ${refreshSeconds} seconds).`
        : `Skipping ${label}: automatic pricing is not supported; keeping its saved value.`,
    );
  }
  const assets = storedAssets.filter((asset) => asset.refresh_due);
  if (assets.length === 0) {
    return { updated: 0, skipped: 0, failed: 0 };
  }
  // Use database time, not application-server clocks, to order overlapping refreshes.
  const startedAt = assets[0].refresh_started_at;

  const stockSymbols = normalizeSymbols(
    assets.filter((a) => a.kind === "stock").map((a) => a.ticker_symbol),
  );
  // Attempt every valid ticker; unmapped coins use Yahoo's USD crypto pairs.
  const cryptoSymbols = normalizeSymbols(
    assets.filter((a) => a.kind === "crypto").map((a) => a.ticker_symbol),
  ).filter(isValidCryptoSymbol);
  const walletAddresses = normalizeWalletAddresses(
    assets
      .filter((a) => a.kind === "wallet")
      .map((a) => a.wallet_address ?? ""),
  );
  const apiKey = process.env.ANKR_API_KEY;
  if (
    (cryptoSymbols.some(usesAnkrCryptoPrice) || walletAddresses.length) &&
    !apiKey?.trim()
  ) {
    logFinance(
      "error",
      "Cannot refresh crypto: ANKR_API_KEY is not configured.",
    );
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
  await updatePrices("stock", stocks.prices, startedAt, userId);
  const crypto = await collectRefreshPrices(cryptoSymbols, async (symbol) => {
    const prices = await getCryptoPrices([symbol], apiKey ?? "");
    return prices[symbol];
  });
  await updatePrices("crypto", crypto.prices, startedAt, userId);
  const wallets = await collectRefreshPrices(walletAddresses, (address) =>
    getWalletBalanceUsd(address, apiKey ?? ""),
  );
  // Do not consume the shared cooldown for other users or non-due duplicates.
  await updatePrices(
    "wallet",
    wallets.prices,
    startedAt,
    userId,
    assets.filter((asset) => asset.kind === "wallet").map((asset) => asset.id),
  );

  const hyperliquidAssets = assets.filter(
    (asset) =>
      asset.kind === "wallet" &&
      asset.hyperliquid_enabled &&
      isEthAddress(asset.wallet_address?.trim() ?? "") &&
      Object.hasOwn(wallets.prices, asset.wallet_address!.trim().toLowerCase()),
  );
  const hyperliquid = await collectRefreshPrices(
    hyperliquidAssets.map((asset) =>
      asset.wallet_address!.trim().toLowerCase(),
    ),
    getHyperliquidBalanceUsd,
  );
  let hyperliquidFailed = 0;
  for (const asset of hyperliquidAssets) {
    const address = asset.wallet_address!.trim().toLowerCase();
    if (!Object.hasOwn(hyperliquid.prices, address)) {
      hyperliquidFailed++;
      continue;
    }
    // Only attach the preview to this request's successful normal refresh.
    await sql.query(
      `
      UPDATE assets AS a
      SET hyperliquid_balance_cents = $1::bigint
      WHERE a.id = $2 AND a.user_id = $3 AND a.kind = 'wallet'
        AND a.hyperliquid_enabled = true
        AND lower(btrim(a.wallet_address)) = $4
        AND a.updated_at < $5::timestamptz
        AND a.price_updated_at = $5::timestamptz
      `,
      [
        Math.round(hyperliquid.prices[address] * 100),
        asset.id,
        userId,
        address,
        startedAt,
      ],
    );
  }

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
  return {
    updated,
    failed,
    skipped: assets.length - updated - failed,
    ...(hyperliquidFailed > 0 ? { hyperliquidFailed } : {}),
  };
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
