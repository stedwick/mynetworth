import { getMobulaAssets } from "./service";
import { mapMobulaAssetsToPrices, parseSymbolsParam } from "./utils";

export const runtime = "nodejs";

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
  const symbolsParam = searchParams.get("symbols");
  const symbols = parseSymbolsParam(symbolsParam);

  if (symbols.length === 0) {
    return Response.json(
      { error: "Provide at least one symbol via ?symbols=BTC,ETH" },
      { status: 400 },
    );
  }

  try {
    const data = await getMobulaAssets(symbols, apiKey);
    const prices = mapMobulaAssetsToPrices(data.dataArray ?? []);

    return Response.json(prices, {
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60",
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
