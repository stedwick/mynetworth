import { unstable_cache } from "next/cache";
import {
  extractWalletBalanceUsd,
  isSupportedWalletAddress,
  mapWalletBalanceToResponse,
  parseAddressParam,
  parseMobulaWalletHistory,
} from "./utils";

export const runtime = "nodejs";

const MOBULA_WALLET_HISTORY_URL = "https://api.mobula.io/api/1/wallet/history";

const getMobulaWalletBalance = unstable_cache(
  async (address: string) => {
    const apiKey = process.env.MOBULA_API_KEY;

    if (!apiKey) {
      throw new Error("Missing MOBULA_API_KEY");
    }

    const url = `${MOBULA_WALLET_HISTORY_URL}?wallet=${encodeURIComponent(address)}`;
    console.info("[crypto/wallet] Fetching Mobula balance for:", address);

    const response = await fetch(url, {
      headers: {
        Authorization: apiKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Mobula request failed");
    }

    const data = parseMobulaWalletHistory(await response.json());
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
      { error: "Provide a valid BTC, ETH, or SOL address via ?address=..." },
      { status: 400 },
    );
  }

  try {
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
