import { z } from "zod";

export const yahooQuoteSchema = z.looseObject({
  symbol: z.string(),
  regularMarketPrice: z.number().nullable().optional(),
});

const yahooQuoteArraySchema = z.array(yahooQuoteSchema);

export type YahooQuote = z.infer<typeof yahooQuoteSchema>;

export const parseYahooQuotes = (data: unknown): YahooQuote[] => {
  return yahooQuoteArraySchema.parse(data);
};

const yahooCryptoQuoteSchema = yahooQuoteSchema.extend({
  quoteType: z.literal("CRYPTOCURRENCY"),
  currency: z.literal("USD"),
  regularMarketPrice: z.number().finite().positive(),
  regularMarketTime: z
    .union([
      z.date().refine((date) => date.getTime() > 0),
      z.number().finite().positive(),
    ])
    .nullish(),
});

export const parseYahooCryptoQuotes = (
  data: unknown,
  symbols: string[],
): YahooQuote[] => {
  const quotes = parseYahooQuotes(data);
  return symbols.map((symbol) =>
    yahooCryptoQuoteSchema.parse(
      quotes.find((quote) => quote.symbol === symbol),
    ),
  );
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
