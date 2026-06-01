import { throwMobulaRequestError } from "@/app/api/crypto/mobula-errors";

import {
  extractBtcPriceUsd,
  convertSatoshisToUsd,
  extractWalletBalanceUsd,
  isBtcAddress,
  mapMobulaWalletBalancesToUsd,
  parseBtcUtxos,
  parseMobulaMarketData,
  parseMobulaWalletBalances,
  parseMobulaWalletPortfolio,
  sumBtcUtxoSatoshis,
} from "./utils";

const MOBULA_WALLET_PORTFOLIO_URL =
  "https://api.mobula.io/api/1/wallet/portfolio";
// Chain IDs map to Ethereum, BNB Smart Chain, Base, Arbitrum,
// Polygon, Avalanche, Optimism, and Monad.
const MOBULA_WALLET_PORTFOLIO_PARAMS =
  "&unlistedAssets=false&blockchains=1,56,solana,8453,42161,137,43114,10,sonic,143";
const MOBULA_MARKET_DATA_URL = "https://api.mobula.io/api/1/market/data";
const BTCSCAN_API_URL = "https://btcscan.org/api";

const getBtcUtxos = async (address: string) => {
  const utxoUrl = `${BTCSCAN_API_URL}/address/${encodeURIComponent(address)}/utxo`;
  console.info("[crypto/wallet] Fetching BTC UTXOs for:", address);

  const utxoResponse = await fetch(utxoUrl, {
    cache: "no-store",
  });

  if (!utxoResponse.ok) {
    throw new Error("BTC UTXO request failed");
  }

  return parseBtcUtxos(await utxoResponse.json());
};

const getMobulaWalletBalance = async (address: string, apiKey: string) => {
  const url = `${MOBULA_WALLET_PORTFOLIO_URL}?wallet=${encodeURIComponent(address)}${MOBULA_WALLET_PORTFOLIO_PARAMS}`;
  console.info("[crypto/wallet] Fetching Mobula portfolio for:", address);

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    await throwMobulaRequestError(response, "Mobula wallet portfolio request");
  }

  const data = parseMobulaWalletPortfolio(await response.json());
  return extractWalletBalanceUsd(data);
};

const getMobulaWalletBalances = async (
  addresses: string[],
  apiKey: string,
): Promise<Record<string, number>> => {
  const url = `${MOBULA_WALLET_PORTFOLIO_URL}?wallets=${encodeURIComponent(addresses.join(","))}${MOBULA_WALLET_PORTFOLIO_PARAMS}`;
  console.info("[crypto/wallet] Fetching Mobula portfolios for:", addresses);

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    await throwMobulaRequestError(response, "Mobula wallet portfolios request");
  }

  const data = parseMobulaWalletBalances(await response.json());
  return mapMobulaWalletBalancesToUsd(data);
};

export const getBtcUsdPrice = async (apiKey: string): Promise<number> => {
  const url = `${MOBULA_MARKET_DATA_URL}?asset=bitcoin`;
  console.info("[crypto/wallet] Fetching BTC price from Mobula market data");

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    await throwMobulaRequestError(response, "Mobula BTC price request");
  }

  const data = parseMobulaMarketData(await response.json());
  return extractBtcPriceUsd(data);
};

export const getWalletBalanceUsd = async (
  address: string,
  apiKey: string,
): Promise<number> => {
  if (isBtcAddress(address)) {
    const utxos = await getBtcUtxos(address);
    const satoshis = sumBtcUtxoSatoshis(utxos);
    const btcUsdPrice = await getBtcUsdPrice(apiKey);
    return convertSatoshisToUsd(satoshis, btcUsdPrice);
  }

  return getMobulaWalletBalance(address, apiKey);
};

export const getBtcWalletBalanceUsd = async (
  address: string,
  btcUsdPrice: number,
): Promise<number> => {
  const utxos = await getBtcUtxos(address);
  const satoshis = sumBtcUtxoSatoshis(utxos);
  return convertSatoshisToUsd(satoshis, btcUsdPrice);
};

export const getWalletBalancesUsd = async (
  addresses: string[],
  apiKey: string,
): Promise<Record<string, number>> => {
  if (addresses.length === 0) {
    return {};
  }

  return getMobulaWalletBalances(addresses, apiKey);
};
