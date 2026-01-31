import { unstable_cache } from "next/cache";

import { getMobulaAssets } from "../price/service";
import { mapMobulaAssetsToPrices } from "../price/utils";
import {
  convertSatoshisToUsd,
  extractWalletBalanceUsd,
  isBtcAddress,
  parseBtcUtxos,
  parseMobulaWalletPortfolio,
  sumBtcUtxoSatoshis,
} from "./utils";

const MOBULA_WALLET_PORTFOLIO_URL =
  "https://api.mobula.io/api/1/wallet/portfolio";
const BTCSCAN_API_URL = "https://btcscan.org/api";

const getBtcUtxos = unstable_cache(
  async (address: string) => {
    const utxoUrl = `${BTCSCAN_API_URL}/address/${encodeURIComponent(address)}/utxo`;
    console.info("[crypto/wallet] Fetching BTC UTXOs for:", address);

    const utxoResponse = await fetch(utxoUrl, {
      cache: "no-store",
    });

    if (!utxoResponse.ok) {
      throw new Error("BTC UTXO request failed");
    }

    return parseBtcUtxos(await utxoResponse.json());
  },
  ["btc-utxos"],
  { revalidate: 3600 },
);

const getMobulaWalletBalance = unstable_cache(
  async (address: string, apiKey: string) => {
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
  },
  ["crypto-wallet-balance"],
  { revalidate: 3600 },
);

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
