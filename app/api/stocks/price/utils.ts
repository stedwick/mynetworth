import { z } from "zod";

export const yahooQuoteSchema = z
  .object({
    symbol: z.string(),
    regularMarketPrice: z.number().nullable().optional(),
  })
  .passthrough();

const yahooQuoteArraySchema = z.array(yahooQuoteSchema);

export type YahooQuote = z.infer<typeof yahooQuoteSchema>;

export const parseYahooQuotes = (data: unknown): YahooQuote[] => {
  return yahooQuoteArraySchema.parse(data);
};

export const parseSymbolsParam = (param: string | null): string[] => {
  if (!param) return [];

  const seen = new Set<string>();
  const symbols: string[] = [];

  for (const raw of param.split(",")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const symbol = trimmed.toUpperCase();
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    symbols.push(symbol);
  }

  return symbols;
};

export const mapYahooQuotesToPrices = (
  quotes: YahooQuote[],
): Record<string, number> => {
  const prices: Record<string, number> = {};

  for (const quote of quotes) {
    if (
      typeof quote.regularMarketPrice === "number" &&
      Number.isFinite(quote.regularMarketPrice)
    ) {
      prices[quote.symbol] = quote.regularMarketPrice;
    }
  }

  return prices;
};
