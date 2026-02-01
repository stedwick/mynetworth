import { cacheLife } from "next/cache";

import { getMobulaAssets } from "../price/service";
import { mapMobulaAssetsToPrices } from "../price/utils";
import {
  convertSatoshisToUsd,
  extractWalletBalanceUsd,
  isBtcAddress,
  mapMobulaWalletBalancesToUsd,
  parseBtcUtxos,
  parseMobulaWalletBalances,
  parseMobulaWalletPortfolio,
  sumBtcUtxoSatoshis,
} from "./utils";

const MOBULA_WALLET_PORTFOLIO_URL =
  "https://api.mobula.io/api/1/wallet/portfolio";
const BTCSCAN_API_URL = "https://btcscan.org/api";

const getBtcUtxos = async (address: string) => {
  "use cache";
  cacheLife("hours");

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
  "use cache";
  cacheLife("hours");

  const url = `${MOBULA_WALLET_PORTFOLIO_URL}?wallet=${encodeURIComponent(address)}&cache=true&stale=3600&unlistedAssets=false`;
  console.info("[crypto/wallet] Fetching Mobula portfolio for:", address);

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Mobula request failed");
  }

  const data = parseMobulaWalletPortfolio(await response.json());
  return extractWalletBalanceUsd(data);
};

const getMobulaWalletBalances = async (
  addresses: string[],
  apiKey: string,
): Promise<Record<string, number>> => {
  "use cache";
  cacheLife("hours");

  const url = `${MOBULA_WALLET_PORTFOLIO_URL}?wallets=${encodeURIComponent(addresses.join(","))}&cache=true&stale=3600&unlistedAssets=false`;
  console.info("[crypto/wallet] Fetching Mobula portfolios for:", addresses);

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Mobula request failed");
  }

  const data = parseMobulaWalletBalances(await response.json());
  return mapMobulaWalletBalancesToUsd(data);
};

export const getWalletBalanceUsd = async (
  address: string,
  apiKey: string,
): Promise<number> => {
  if (isBtcAddress(address)) {
    const utxos = await getBtcUtxos(address);
    const satoshis = sumBtcUtxoSatoshis(utxos);
    const btcData = await getMobulaAssets(["BTC"], apiKey);
    const prices = mapMobulaAssetsToPrices(btcData.dataArray ?? []);
    const btcUsdPrice = prices.BTC;

    if (typeof btcUsdPrice !== "number") {
      throw new Error("BTC price missing");
    }

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
