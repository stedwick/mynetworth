import { cacheLife } from "next/cache";

import { getMobulaAssets } from "@/app/api/crypto/price/service";
import { mapMobulaAssetsToPrices } from "@/app/api/crypto/price/utils";
import { logApiRequest } from "@/app/lib/fetch-log";
import { formatUsd } from "@/app/lib/networth";

import {
  convertBtcToUsd,
  extractMoralisBtcBalance,
  extractNetWorthUsd,
  extractWalletBalanceUsd,
  isBtcAddress,
  isEthAddress,
  parseMobulaWalletPortfolio,
  parseMoralisNetWorth,
  parseMoralisWalletTokens,
  type MoralisWalletTokens,
} from "./utils";

const MOBULA_WALLET_PORTFOLIO_URL =
  "https://api.mobula.io/api/1/wallet/portfolio";
// Chain IDs map to Ethereum, BNB Smart Chain, Base, Arbitrum,
// Polygon, Avalanche, Optimism, and Monad.
const MOBULA_WALLET_PORTFOLIO_PARAMS =
  "&cache=true&stale=3600&unlistedAssets=false&blockchains=1,56,solana,8453,42161,137,43114,10,sonic,143";
const MORALIS_NET_WORTH_URL = "https://deep-index.moralis.io/api/v2.2/wallets";
const MORALIS_WALLET_TOKENS_URL = "https://api.moralis.com/v1/wallets";
// Moralis chain slugs map to Ethereum, BNB Smart Chain, Base, Arbitrum,
// Polygon, Avalanche, Optimism, and Monad.
const MORALIS_EVM_CHAINS = [
  "eth",
  "bsc",
  "base",
  "arbitrum",
  "polygon",
  "avalanche",
  "optimism",
  "monad",
];

export type WalletApiKeys = {
  moralisApiKey: string;
  mobulaApiKey: string;
};

const getMobulaWalletBalance = async (address: string, apiKey: string) => {
  "use cache";
  cacheLife("hours");

  const url = `${MOBULA_WALLET_PORTFOLIO_URL}?wallet=${encodeURIComponent(address)}${MOBULA_WALLET_PORTFOLIO_PARAMS}`;

  return logApiRequest(
    "Mobula wallet portfolio",
    url,
    {
      headers: {
        Authorization: apiKey,
      },
      cache: "no-store",
    },
    (data) => {
      const value = extractWalletBalanceUsd(parseMobulaWalletPortfolio(data));
      return { value, summary: `${address} → ${formatUsd(value)}` };
    },
  );
};

const getMoralisEvmNetWorthUsd = async (
  address: string,
  apiKey: string,
): Promise<number> => {
  "use cache";
  cacheLife("hours");

  const chainParams = MORALIS_EVM_CHAINS.map(
    (chain) => `chains=${encodeURIComponent(chain)}`,
  ).join("&");
  const url = `${MORALIS_NET_WORTH_URL}/${encodeURIComponent(address)}/net-worth?${chainParams}&exclude_spam=true`;

  return logApiRequest(
    "Moralis net worth",
    url,
    {
      headers: {
        "X-API-Key": apiKey,
      },
      cache: "no-store",
    },
    (data) => {
      const value = extractNetWorthUsd(parseMoralisNetWorth(data));
      return { value, summary: `${address} → ${formatUsd(value)}` };
    },
  );
};

const getMoralisBtcBalance = async (
  address: string,
  apiKey: string,
): Promise<number> => {
  "use cache";
  cacheLife("hours");

  let total = 0;
  let cursor: string | null = null;

  do {
    const cursorParam: string = cursor
      ? `&cursor=${encodeURIComponent(cursor)}`
      : "";
    const url: string = `${MORALIS_WALLET_TOKENS_URL}/${encodeURIComponent(address)}/tokens?limit=100${cursorParam}`;

    const page: MoralisWalletTokens = await logApiRequest(
      "Moralis BTC tokens",
      url,
      {
        headers: {
          "X-Api-Key": apiKey,
        },
        cache: "no-store",
      },
      (data) => {
        const value = parseMoralisWalletTokens(data);
        const runningTotal = total + extractMoralisBtcBalance(value);
        return { value, summary: `${address} → ${runningTotal} BTC` };
      },
    );

    total += extractMoralisBtcBalance(page);
    cursor = page.cursor;
  } while (cursor);

  return total;
};

export const getWalletBalanceUsd = async (
  address: string,
  { moralisApiKey, mobulaApiKey }: WalletApiKeys,
): Promise<number> => {
  if (isBtcAddress(address)) {
    const btcBalance = await getMoralisBtcBalance(address, moralisApiKey);
    const btcPriceData = await getMobulaAssets(["BTC"], mobulaApiKey);
    const btcUsdPrice = mapMobulaAssetsToPrices(
      btcPriceData.dataArray ?? [],
    ).BTC;

    if (typeof btcUsdPrice !== "number") {
      throw new Error("BTC price missing");
    }

    const value = convertBtcToUsd(btcBalance, btcUsdPrice);
    console.info(
      `[api] BTC wallet value: ${address} → ${btcBalance} BTC × ${formatUsd(btcUsdPrice)} (Mobula) = ${formatUsd(value)}`,
    );
    return value;
  }

  if (isEthAddress(address)) {
    return getMoralisEvmNetWorthUsd(address, moralisApiKey);
  }

  return getMobulaWalletBalance(address, mobulaApiKey);
};
