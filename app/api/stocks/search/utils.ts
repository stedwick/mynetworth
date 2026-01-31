import { z } from "zod";

type YahooSearchQuote = {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchDisp?: string;
  typeDisp?: string;
  marketCap?: number;
};

const yahooSearchQuoteSchema = z.looseObject({
  symbol: z.string(),
  shortname: z.string().optional(),
  longname: z.string().optional(),
  exchDisp: z.string().optional(),
  typeDisp: z.string().optional(),
  marketCap: z.number().optional(),
});

const yahooSearchResponseSchema = z.object({
  quotes: z.array(yahooSearchQuoteSchema).optional(),
});

export type YahooSearchResponse = z.infer<typeof yahooSearchResponseSchema>;

export type YahooSearchMatch = {
  symbol: string;
  name?: string;
  marketCap?: number;
};

export type YahooSearchResult = {
  symbol: string;
  name?: string;
};

export const parseYahooSearchResponse = (
  data: unknown,
): YahooSearchResponse => {
  return yahooSearchResponseSchema.parse(data);
};

export const parseSearchQueryParam = (param: string | null): string | null => {
  if (!param) return null;
  const trimmed = param.trim();
  if (trimmed.length < 2) return null;
  return trimmed;
};

export const mapYahooSearchQuotesToMatches = (
  quotes: YahooSearchQuote[],
): YahooSearchMatch[] => {
  const matches: YahooSearchMatch[] = [];
  const seen = new Set<string>();

  for (const quote of quotes) {
    const symbol = quote.symbol.trim().toUpperCase();
    if (!symbol) continue;
    if (seen.has(symbol)) continue;
    seen.add(symbol);

    matches.push({
      symbol,
      name: quote.shortname ?? quote.longname,
      marketCap:
        typeof quote.marketCap === "number" && Number.isFinite(quote.marketCap)
          ? quote.marketCap
          : undefined,
    });
  }

  return matches;
};

export const sortYahooSearchMatchesByMarketCap = (
  matches: YahooSearchMatch[],
): YahooSearchMatch[] => {
  return [...matches].sort((a, b) => {
    const aCap = typeof a.marketCap === "number" ? a.marketCap : -1;
    const bCap = typeof b.marketCap === "number" ? b.marketCap : -1;

    if (aCap !== bCap) return bCap - aCap;
    return a.symbol.localeCompare(b.symbol);
  });
};

export const orderYahooSearchMatches = (
  matches: YahooSearchMatch[],
  query: string,
): YahooSearchResult[] => {
  const normalizedQuery = query.trim().toUpperCase();
  const exactMatchIndex = matches.findIndex(
    (match) => match.symbol.toUpperCase() === normalizedQuery,
  );
  const exactMatch =
    exactMatchIndex >= 0 ? matches[exactMatchIndex] : undefined;
  const remaining = matches.filter((_, index) => index !== exactMatchIndex);
  const sorted = sortYahooSearchMatchesByMarketCap(remaining);

  if (!exactMatch) {
    return sorted.map(({ symbol, name }) => ({ symbol, name }));
  }

  return [
    { symbol: exactMatch.symbol, name: exactMatch.name },
    ...sorted.map(({ symbol, name }) => ({ symbol, name })),
  ];
};
