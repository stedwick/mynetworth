import { cacheLife } from "next/cache";
import YahooFinance from "yahoo-finance2";

import { parseYahooQuotes, type YahooQuote } from "./utils";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const getYahooQuotes = async (
  symbols: string[],
): Promise<YahooQuote[]> => {
  "use cache";
  cacheLife("hours");

  const startedAt = Date.now();
  const result = await yahooFinance.quote(symbols, { return: "array" });
  const elapsedMs = Date.now() - startedAt;

  const quotes = parseYahooQuotes(result);
  console.info(
    `[api] Yahoo quotes: ${symbols.join(",")} → ${quotes.length} quotes (${elapsedMs}ms)`,
  );

  return quotes;
};
