import "server-only";

import type { Selectable } from "kysely";

import { sql } from "@/app/lib/db";
import type { DB } from "@/app/lib/db-types";
import {
  chunkList,
  normalizeSymbols,
  normalizeWalletAddresses,
} from "@/app/lib/price-refresh";
import { getMobulaAssets } from "@/app/api/crypto/price/service";
import { mapMobulaAssetsToPrices } from "@/app/api/crypto/price/utils";
import {
  getBtcWalletBalanceUsd,
  getBtcUsdPrice,
  getWalletBalanceUsd,
} from "@/app/api/crypto/wallet/service";
import { isBtcAddress } from "@/app/api/crypto/wallet/utils";
import { getYahooQuotes } from "@/app/api/stocks/price/service";
import { mapYahooQuotesToPrices } from "@/app/api/stocks/price/utils";

type AssetRow = Selectable<DB["assets"]>;

type RefreshResult = {
  updated: number;
  skipped: number;
};

const PRICE_BATCH_SIZE = 50;

const getRefreshableAssetsForUser = async (
  userId: string,
): Promise<AssetRow[]> => {
  const refreshSecondsRaw = process.env.PRICE_REFRESH_SECONDS;
  const refreshSeconds = refreshSecondsRaw
    ? Number.parseInt(refreshSecondsRaw, 10)
    : 3600;
  const hasRefreshLimit = Number.isFinite(refreshSeconds) && refreshSeconds > 0;

  const query = `
    SELECT *
    FROM assets
    WHERE user_id = $1
      AND kind <> 'manual'
      ${hasRefreshLimit ? `AND price_updated_at < now() - interval '${refreshSeconds} seconds'` : ""}
  `;
  const rows = (await sql.query(query, [userId])) as AssetRow[];

  return rows;
};

const premarkAssetsByTargets = async (
  stockSymbols: string[],
  cryptoSymbols: string[],
  walletAddresses: string[],
): Promise<void> => {
  const conditions: string[] = [];
  const params: Array<string[]> = [];
  let index = 1;

  if (stockSymbols.length > 0) {
    conditions.push(
      `(kind = 'stock' AND upper(ticker_symbol) = ANY($${index}::text[]))`,
    );
    params.push(stockSymbols);
    index += 1;
  }

  if (cryptoSymbols.length > 0) {
    conditions.push(
      `(kind = 'crypto' AND upper(ticker_symbol) = ANY($${index}::text[]))`,
    );
    params.push(cryptoSymbols);
    index += 1;
  }

  if (walletAddresses.length > 0) {
    conditions.push(
      `(kind = 'wallet' AND wallet_address = ANY($${index}::text[]))`,
    );
    params.push(walletAddresses);
    index += 1;
  }

  if (conditions.length === 0) {
    return;
  }

  const query = `
    UPDATE assets
    SET price_updated_at = now()
    WHERE kind <> 'manual'
      AND (${conditions.join(" OR ")})
  `;

  await sql.query(query, params);
};

const toValueCents = (price: number): number => {
  return Math.round(price * 100);
};

const updateAssetsBySymbol = async (
  kind: "stock" | "crypto",
  prices: Record<string, number>,
): Promise<void> => {
  const updates = Object.entries(prices)
    .map(([symbol, price]) => ({
      symbol: symbol.trim().toUpperCase(),
      valueCents: toValueCents(price),
    }))
    .filter(
      ({ symbol, valueCents }) =>
        Boolean(symbol) && Number.isFinite(valueCents),
    );

  if (updates.length === 0) {
    return;
  }

  const values = updates
    .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
    .join(", ");
  const params = updates.flatMap((update) => [
    update.symbol,
    update.valueCents,
  ]);
  const kindParamIndex = params.length + 1;

  const query = `
    UPDATE assets AS a
    SET value_cents = v.value_cents::bigint
    FROM (VALUES ${values}) AS v(symbol, value_cents)
    WHERE a.kind = $${kindParamIndex}
      AND upper(a.ticker_symbol) = v.symbol
  `;

  await sql.query(query, [...params, kind]);
};

const updateAssetsByWallet = async (
  balances: Record<string, number>,
): Promise<void> => {
  const updates = Object.entries(balances)
    .map(([address, balance]) => ({
      address: address.trim(),
      valueCents: toValueCents(balance),
    }))
    .filter(
      ({ address, valueCents }) =>
        Boolean(address) && Number.isFinite(valueCents),
    );

  if (updates.length === 0) {
    return;
  }

  const values = updates
    .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
    .join(", ");
  const params = updates.flatMap((update) => [
    update.address,
    update.valueCents,
  ]);

  const query = `
    UPDATE assets AS a
    SET value_cents = v.value_cents::bigint
    FROM (VALUES ${values}) AS v(wallet_address, value_cents)
    WHERE a.kind = 'wallet'
      AND a.wallet_address = v.wallet_address
  `;

  await sql.query(query, params);
};

const fetchStockPrices = async (
  symbols: string[],
): Promise<Record<string, number>> => {
  const prices: Record<string, number> = {};

  for (const batch of chunkList(symbols, PRICE_BATCH_SIZE)) {
    const quotes = await getYahooQuotes(batch);
    Object.assign(prices, mapYahooQuotesToPrices(quotes));
  }

  return prices;
};

const fetchCryptoPrices = async (
  symbols: string[],
  apiKey: string,
): Promise<Record<string, number>> => {
  const prices: Record<string, number> = {};

  for (const batch of chunkList(symbols, PRICE_BATCH_SIZE)) {
    const data = await getMobulaAssets(batch, apiKey);
    Object.assign(prices, mapMobulaAssetsToPrices(data.dataArray ?? []));
  }

  return prices;
};

const fetchWalletBalances = async (
  addresses: string[],
  apiKey: string,
): Promise<Record<string, number>> => {
  const balances: Record<string, number> = {};
  const btcAddresses = addresses.filter((address) => isBtcAddress(address));
  const otherAddresses = addresses.filter((address) => !isBtcAddress(address));

  if (otherAddresses.length > 0) {
    for (const address of otherAddresses) {
      balances[address] = await getWalletBalanceUsd(address, apiKey);
    }
  }

  if (btcAddresses.length > 0) {
    const btcUsdPrice = await getBtcUsdPrice(apiKey);

    for (const batch of chunkList(btcAddresses, PRICE_BATCH_SIZE)) {
      const results = await Promise.all(
        batch.map(async (address) => ({
          address,
          balance: await getBtcWalletBalanceUsd(address, btcUsdPrice),
        })),
      );

      for (const result of results) {
        balances[result.address] = result.balance;
      }
    }
  }

  return balances;
};

export const refreshAssetPricesForUser = async (
  userId: string,
): Promise<RefreshResult> => {
  const assets = await getRefreshableAssetsForUser(userId);

  if (assets.length === 0) {
    return { updated: 0, skipped: 0 };
  }

  const stockSymbols = normalizeSymbols(
    assets
      .filter((asset) => asset.kind === "stock")
      .map((asset) => asset.ticker_symbol),
  );
  const cryptoSymbols = normalizeSymbols(
    assets
      .filter((asset) => asset.kind === "crypto")
      .map((asset) => asset.ticker_symbol),
  );

  const rawWalletAddresses = assets
    .filter((asset) => asset.kind === "wallet")
    .map((asset) => asset.wallet_address ?? "")
    .map((address) => address.trim())
    .filter(Boolean);
  const walletAddresses = normalizeWalletAddresses(rawWalletAddresses);

  await premarkAssetsByTargets(stockSymbols, cryptoSymbols, walletAddresses);

  const needsMobula = cryptoSymbols.length > 0 || walletAddresses.length > 0;
  const mobulaApiKey = process.env.MOBULA_API_KEY;

  if (needsMobula && !mobulaApiKey) {
    throw new Error("Missing MOBULA_API_KEY");
  }

  const stockPrices =
    stockSymbols.length > 0 ? await fetchStockPrices(stockSymbols) : {};

  const cryptoPrices =
    cryptoSymbols.length > 0
      ? await fetchCryptoPrices(cryptoSymbols, mobulaApiKey ?? "")
      : {};

  const walletBalances =
    walletAddresses.length > 0
      ? await fetchWalletBalances(walletAddresses, mobulaApiKey ?? "")
      : {};

  await updateAssetsBySymbol("stock", stockPrices);
  await updateAssetsBySymbol("crypto", cryptoPrices);
  await updateAssetsByWallet(walletBalances);

  const updatedStockSymbols = new Set(
    Object.keys(stockPrices).map((symbol) => symbol.trim().toUpperCase()),
  );
  const updatedCryptoSymbols = new Set(
    Object.keys(cryptoPrices).map((symbol) => symbol.trim().toUpperCase()),
  );
  const updatedWallets = new Set(
    Object.keys(walletBalances).map((address) => address.trim()),
  );

  const updated = assets.filter((asset) => {
    if (asset.kind === "stock") {
      return updatedStockSymbols.has(asset.ticker_symbol.trim().toUpperCase());
    }

    if (asset.kind === "crypto") {
      return updatedCryptoSymbols.has(asset.ticker_symbol.trim().toUpperCase());
    }

    if (asset.kind === "wallet") {
      const address = asset.wallet_address?.trim() ?? "";
      return address ? updatedWallets.has(address) : false;
    }

    return false;
  }).length;

  const skipped = assets.length - updated;

  return { updated, skipped };
};
