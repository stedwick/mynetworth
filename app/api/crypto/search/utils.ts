import type { YahooSearchResponse } from "@/app/api/stocks/search/utils";
import { isValidCryptoSymbol } from "@/app/lib/crypto-assets";

export const parseSearchQueryParam = (param: string | null): string | null => {
  if (!param) return null;
  const trimmed = param.trim();
  return trimmed.length < 2 ? null : trimmed;
};

export const getCryptoSearchQueries = (query: string): string[] => {
  const normalized = query.trim().toUpperCase();
  return isValidCryptoSymbol(normalized) && !normalized.endsWith("-USD")
    ? [query.trim(), `${normalized}-USD`]
    : [query.trim()];
};

export const mapYahooCryptoSearchResults = (
  quotes: NonNullable<YahooSearchResponse["quotes"]>,
  query: string,
  limit = 20,
): { symbol: string; name?: string }[] => {
  const normalized = query.trim().toUpperCase();
  if (!normalized || limit <= 0) return [];
  const exactSymbol = normalized.endsWith("-USD")
    ? normalized
    : `${normalized}-USD`;
  const seen = new Set<string>();
  const matches: { symbol: string; name?: string }[] = [];
  for (const quote of quotes) {
    const symbol = quote.symbol.trim().toUpperCase();
    if (
      quote.quoteType !== "CRYPTOCURRENCY" ||
      quote.isYahooFinance !== true ||
      (quote.currency !== undefined && quote.currency !== "USD") ||
      !symbol.endsWith("-USD") ||
      !isValidCryptoSymbol(symbol) ||
      seen.has(symbol)
    )
      continue;
    seen.add(symbol);
    // Keep the exact provider pair; stripping it could select an Ankr ticker collision.
    matches.push({
      symbol,
      name: (quote.longname ?? quote.shortname)?.replace(/ USD$/, ""),
    });
  }
  return matches
    .sort(
      (a, b) =>
        Number(b.symbol === exactSymbol) - Number(a.symbol === exactSymbol),
    )
    .slice(0, limit);
};
