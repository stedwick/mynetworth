import {
  isSupportedWalletAddress,
  mapWalletBalanceToResponse,
  parseAddressParam,
} from "./utils";
import { getWalletBalanceUsd } from "./service";

export async function GET(request: Request): Promise<Response> {
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
        error:
          "Provide a valid EVM, BTC, or Solana address via ?address=... (Solana: native SOL only)",
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANKR_API_KEY;
  if (!apiKey?.trim()) {
    return Response.json(
      { error: "Missing ANKR_API_KEY" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const totalBalanceUsd = await getWalletBalanceUsd(addressParam, apiKey);
    const responseBody = mapWalletBalanceToResponse(
      addressParam,
      totalBalanceUsd,
    );

    return Response.json(responseBody, {
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60",
      },
    });
  } catch {
    return Response.json(
      { error: "Wallet balance request failed" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
