import YahooFinance from "yahoo-finance2";

import { parseYahooQuotes, type YahooQuote } from "./utils";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const getYahooQuotes = async (
  symbols: string[],
): Promise<YahooQuote[]> => {
  console.info("[stocks/price] Fetching Yahoo quotes for:", symbols.join(","));
  const result = await yahooFinance.quote(symbols, { return: "array" });
  return parseYahooQuotes(result);
};
