import { getYahooQuotes } from "./service";
import { mapYahooQuotesToPrices, parseSymbolsParam } from "./utils";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");
  const symbols = parseSymbolsParam(symbolsParam);

  if (symbols.length === 0) {
    return Response.json(
      { error: "Provide at least one symbol via ?symbols=AAPL,TSLA" },
      { status: 400 },
    );
  }

  try {
    const quotes = await getYahooQuotes(symbols);
    const prices = mapYahooQuotesToPrices(quotes);

    return Response.json(prices, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { error: "Yahoo Finance request failed" },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
