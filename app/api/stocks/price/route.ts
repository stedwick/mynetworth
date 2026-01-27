import { unstable_cache } from "next/cache";
import YahooFinance from "yahoo-finance2";
import {
  mapYahooQuotesToPrices,
  parseSymbolsParam,
  parseYahooQuotes,
} from "./utils";

export const runtime = "nodejs";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const getYahooQuotes = unstable_cache(
  async (symbols: string[]) => {
    console.info(
      "[stocks/price] Fetching Yahoo quotes for:",
      symbols.join(","),
    );
    const result = await yahooFinance.quote(symbols, { return: "array" });
    return parseYahooQuotes(result);
  },
  ["stocks-price"],
  { revalidate: 3600 },
);

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
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=60",
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
