import {
  isSupportedWalletAddress,
  mapWalletBalanceToResponse,
  parseAddressParam,
} from "./utils";
import { getWalletBalanceUsd } from "./service";

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
    const totalBalanceUsd = await getWalletBalanceUsd(addressParam, apiKey);
    const responseBody = mapWalletBalanceToResponse(
      addressParam,
      totalBalanceUsd,
    );

    return Response.json(responseBody, {
      headers: {
        "Cache-Control": "no-store",
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
