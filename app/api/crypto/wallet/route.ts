import {
  isBtcAddress,
  isEthAddress,
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
        error: "Provide a valid EVM, SOL, or BTC address via ?address=...",
      },
      { status: 400 },
    );
  }

  const usesMoralis = isBtcAddress(addressParam) || isEthAddress(addressParam);
  const moralisApiKey = process.env.MORALIS_API_KEY;
  const mobulaApiKey = process.env.MOBULA_API_KEY;

  if (usesMoralis && !moralisApiKey) {
    return Response.json(
      { error: "Missing MORALIS_API_KEY" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (!usesMoralis && !mobulaApiKey) {
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

  try {
    const totalBalanceUsd = await getWalletBalanceUsd(addressParam, {
      moralisApiKey: moralisApiKey ?? "",
      mobulaApiKey: mobulaApiKey ?? "",
    });
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
