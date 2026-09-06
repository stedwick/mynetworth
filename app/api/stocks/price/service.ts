import "server-only";

import { cacheLife } from "next/cache";
import YahooFinance from "yahoo-finance2";

import {
  mapYahooQuotesToPrices,
  parseYahooQuotes,
  parseYahooCryptoQuotes,
  type YahooQuote,
} from "./utils";
import { logFinance } from "@/app/lib/finance-log";
import { formatUsd } from "@/app/lib/networth";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const getCachedYahooQuotes = async (symbols: string[]) => {
  "use cache";
  cacheLife("hours");

  const fetchedAt = performance.timeOrigin + performance.now();
  const result = await yahooFinance.quote(symbols, { return: "array" });
  const quotes = parseYahooQuotes(result);
  return { quotes, fetchedAt };
};

export const getYahooQuotes = async (
  symbols: string[],
  kind: "stock" | "crypto" = "stock",
): Promise<YahooQuote[]> => {
  const startedAt = performance.timeOrigin + performance.now();
  const requested = [
    ...new Set(symbols.map((symbol) => symbol.trim().toUpperCase())),
  ].filter(Boolean);
  let result: Awaited<ReturnType<typeof getCachedYahooQuotes>>;
  try {
    result =
      kind === "crypto"
        ? {
            quotes: parseYahooCryptoQuotes(
              await yahooFinance.quote(requested, { return: "array" }),
              requested,
            ),
            fetchedAt: performance.timeOrigin + performance.now(),
          }
        : await getCachedYahooQuotes(symbols);
  } catch (error) {
    for (const symbol of requested) {
      logFinance(
        "error",
        `Yahoo Finance could not fetch the ${kind} price for ${symbol}.`,
      );
    }
    throw error;
  }
  const { quotes, fetchedAt } = result;
  const prices = mapYahooQuotesToPrices(quotes);
  // Only a result predating this call came from Next's hours cache.
  const cached = kind === "stock" && fetchedAt < startedAt;
  const minutes = cached
    ? Math.max(
        0,
        Math.floor(
          (performance.timeOrigin + performance.now() - fetchedAt) / 60_000,
        ),
      )
    : 0;
  const age =
    minutes === 0
      ? "less than a minute ago"
      : `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  for (const symbol of requested) {
    if (!Object.hasOwn(prices, symbol)) {
      logFinance(
        "error",
        `Yahoo Finance returned no usable ${kind} price for ${symbol}.`,
      );
    } else if (cached) {
      logFinance(
        "cache",
        `Using cached Yahoo Finance price, ${symbol} is ${formatUsd(prices[symbol])} USD (fetched ${age}).`,
      );
    } else {
      logFinance(
        "success",
        `Using Yahoo Finance, ${symbol} ${kind} price is ${formatUsd(prices[symbol])} USD (fresh).`,
      );
    }
  }
  return quotes;
};
