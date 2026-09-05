import { isSupportedCryptoSymbol } from "@/app/lib/crypto-assets";
import { getCryptoPrices } from "./service";
import { parseSymbolsParam } from "./utils";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");
  const symbols = parseSymbolsParam(symbolsParam);

  if (symbols.length === 0) {
    return Response.json(
      { error: "Provide at least one symbol via ?symbols=BTC,ETH" },
      { status: 400 },
    );
  }

  if (!symbols.every(isSupportedCryptoSymbol)) {
    return Response.json(
      { error: "Unsupported crypto symbol" },
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
    const prices = await getCryptoPrices(symbols, apiKey);

    return Response.json(prices, {
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60",
      },
    });
  } catch {
    return Response.json(
      { error: "Ankr request failed" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
