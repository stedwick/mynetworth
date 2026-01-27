import { unstable_cache } from "next/cache";
import {
  extractWalletBalanceUsd,
  isSupportedWalletAddress,
  isBtcWalletsEnabled,
  mapWalletBalanceToResponse,
  parseAddressParam,
  parseMobulaWalletPortfolio,
} from "./utils";

export const runtime = "nodejs";

const MOBULA_WALLET_PORTFOLIO_URL = "https://api.mobula.io/api/1/wallet/portfolio";

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
  const allowBtc = isBtcWalletsEnabled(process.env.ALLOW_BTC_WALLETS);

  if (!addressParam) {
    return Response.json(
      { error: "Provide a wallet address via ?address=..." },
      { status: 400 },
    );
  }

  if (!isSupportedWalletAddress(addressParam, { allowBtc })) {
    return Response.json(
      {
        error: allowBtc
          ? "Provide a valid EVM, SOL, or BTC address via ?address=..."
          : "Provide a valid EVM or SOL address via ?address=...",
      },
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
