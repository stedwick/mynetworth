import { unstable_cache } from "next/cache";
import {
  convertSatoshisToUsd,
  extractWalletBalanceUsd,
  isBtcAddress,
  isSupportedWalletAddress,
  mapWalletBalanceToResponse,
  parseBtcUtxos,
  parseAddressParam,
  parseMobulaWalletPortfolio,
  sumBtcUtxoSatoshis,
} from "./utils";
import { getMobulaAssets } from "../price/service";
import { mapMobulaAssetsToPrices } from "../price/utils";

export const runtime = "nodejs";

const MOBULA_WALLET_PORTFOLIO_URL = "https://api.mobula.io/api/1/wallet/portfolio";
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
  async (address: string) => {
    const apiKey = process.env.MOBULA_API_KEY;

    if (!apiKey) {
      throw new Error("Missing MOBULA_API_KEY");
    }

    const url = `${MOBULA_WALLET_PORTFOLIO_URL}?wallet=${encodeURIComponent(address)}&cache=true&stale=3600`;
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

export async function GET(request: Request): Promise<Response> {
  const apiKey = process.env.MOBULA_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "Missing MOBULA_API_KEY" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const addressParam = parseAddressParam(searchParams.get("address"));

  if (!addressParam) {
    return Response.json(
      { error: "Provide a wallet address via ?address=..." },
      { status: 400 },
    );
  }

  if (!isSupportedWalletAddress(addressParam)) {
    return Response.json(
      {
        error: "Provide a valid EVM, SOL, or BTC address via ?address=...",
      },
      { status: 400 },
    );
  }

  try {
    if (isBtcAddress(addressParam)) {
      const utxos = await getBtcUtxos(addressParam);
      const satoshis = sumBtcUtxoSatoshis(utxos);
      const btcData = await getMobulaAssets(["BTC"], apiKey);
      const prices = mapMobulaAssetsToPrices(btcData.dataArray ?? []);
      const btcUsdPrice = prices.BTC;

      if (typeof btcUsdPrice !== "number") {
        throw new Error("BTC price missing");
      }

      const usdBalance = convertSatoshisToUsd(satoshis, btcUsdPrice);
      const responseBody = mapWalletBalanceToResponse(addressParam, usdBalance);

      return Response.json(responseBody, {
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60",
        },
      });
    }

    const totalBalanceUsd = await getMobulaWalletBalance(addressParam);
    const responseBody = mapWalletBalanceToResponse(addressParam, totalBalanceUsd);

    return Response.json(responseBody, {
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60",
      },
    });
  } catch {
    return Response.json(
      { error: "Mobula request failed" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
