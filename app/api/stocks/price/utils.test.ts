import { describe, expect, it } from "bun:test";
import { mapYahooQuotesToPrices, parseSymbolsParam, parseYahooQuotes } from "./utils";

describe("parseSymbolsParam", () => {
  it("normalizes, trims, and de-duplicates symbols", () => {
    const result = parseSymbolsParam(" AAPL , tsla, ,AAPL ");

    expect(result).toEqual(["AAPL", "TSLA"]);
  });
});

describe("mapYahooQuotesToPrices", () => {
  it("maps valid prices and skips missing values", () => {
    const result = mapYahooQuotesToPrices([
      { symbol: "AAPL", regularMarketPrice: 200.12 },
      { symbol: "TSLA", regularMarketPrice: null },
      { symbol: "MSFT" },
      { symbol: "NVDA", regularMarketPrice: 710 },
    ]);

    expect(result).toEqual({ AAPL: 200.12, NVDA: 710 });
  });
});

describe("parseYahooQuotes", () => {
  it("accepts quote objects with required fields and extra data", () => {
    const result = parseYahooQuotes([
      { symbol: "AAPL", regularMarketPrice: 200.12, extra: "ok" },
    ]);

    expect(result).toEqual([
      { symbol: "AAPL", regularMarketPrice: 200.12, extra: "ok" },
    ]);
  });

  it("rejects quotes missing a symbol", () => {
    expect(() => parseYahooQuotes([{ regularMarketPrice: 200 }])).toThrow();
  });
});
