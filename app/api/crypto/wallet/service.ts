import { cacheLife } from "next/cache";

import { logApiRequest } from "@/app/lib/fetch-log";
import { formatUsd } from "@/app/lib/networth";

import {
  extractNetWorthUsd,
  extractWalletBalanceUsd,
  isBtcAddress,
  isEthAddress,
  parseMobulaWalletPortfolio,
  parseMoralisNetWorth,
  parseMoralisWalletTokens,
  sumMoralisTokenUsdValues,
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

const getMoralisBtcBalanceUsd = async (
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
        const runningTotal = total + sumMoralisTokenUsdValues(value);
        return { value, summary: `${address} → ${formatUsd(runningTotal)}` };
      },
    );

    total += sumMoralisTokenUsdValues(page);
    cursor = page.cursor;
  } while (cursor);

  return total;
};

export const getWalletBalanceUsd = async (
  address: string,
  { moralisApiKey, mobulaApiKey }: WalletApiKeys,
): Promise<number> => {
  if (isBtcAddress(address)) {
    return getMoralisBtcBalanceUsd(address, moralisApiKey);
  }

  if (isEthAddress(address)) {
    return getMoralisEvmNetWorthUsd(address, moralisApiKey);
  }

  return getMobulaWalletBalance(address, mobulaApiKey);
};
