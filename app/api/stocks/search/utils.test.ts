import { describe, expect, it } from "bun:test";
import {
  mapYahooSearchQuotesToMatches,
  orderYahooSearchMatches,
  parseSearchQueryParam,
  parseYahooSearchResponse,
  sortYahooSearchMatchesByMarketCap,
} from "./utils";

describe("parseSearchQueryParam", () => {
  it("returns null for empty input", () => {
    expect(parseSearchQueryParam(null)).toBeNull();
    expect(parseSearchQueryParam("   ")).toBeNull();
    expect(parseSearchQueryParam("a")).toBeNull();
  });

  it("trims the query string", () => {
    expect(parseSearchQueryParam("  apple ")).toBe("apple");
  });
});

describe("parseYahooSearchResponse", () => {
  it("accepts a quotes payload", () => {
    const result = parseYahooSearchResponse({
      quotes: [{ symbol: "AAPL", shortname: "Apple", extra: true }],
    });

    expect(result.quotes?.[0]).toEqual({
      symbol: "AAPL",
      shortname: "Apple",
      extra: true,
    });
  });
});

describe("mapYahooSearchQuotesToMatches", () => {
  it("maps quotes to unique matches", () => {
    const result = mapYahooSearchQuotesToMatches([
      { symbol: " aapl ", shortname: "Apple", marketCap: 100 },
      { symbol: "AAPL", longname: "Apple Inc.", marketCap: 99 },
      { symbol: "msft", longname: "Microsoft" },
      { symbol: "  " },
    ]);

    expect(result).toEqual([
      {
        symbol: "AAPL",
        name: "Apple",
        marketCap: 100,
      },
      {
        symbol: "MSFT",
        name: "Microsoft",
        marketCap: undefined,
      },
    ]);
  });
});

describe("sortYahooSearchMatchesByMarketCap", () => {
  it("sorts by market cap descending, then symbol", () => {
    const result = sortYahooSearchMatchesByMarketCap([
      { symbol: "BBB", name: "B", marketCap: 200 },
      { symbol: "AAA", name: "A" },
      { symbol: "CCC", name: "C", marketCap: 200 },
      { symbol: "DDD", name: "D", marketCap: 50 },
    ]);

    expect(result).toEqual([
      { symbol: "BBB", name: "B", marketCap: 200 },
      { symbol: "CCC", name: "C", marketCap: 200 },
      { symbol: "DDD", name: "D", marketCap: 50 },
      { symbol: "AAA", name: "A" },
    ]);
  });
});

describe("orderYahooSearchMatches", () => {
  it("places an exact symbol match first then sorts the rest", () => {
    const result = orderYahooSearchMatches(
      [
        { symbol: "BBB", name: "B", marketCap: 200 },
        { symbol: "AAA", name: "A" },
        { symbol: "CCC", name: "C", marketCap: 300 },
      ],
      "aaa",
    );

    expect(result).toEqual([
      { symbol: "AAA", name: "A" },
      { symbol: "CCC", name: "C" },
      { symbol: "BBB", name: "B" },
    ]);
  });

  it("falls back to market cap sorting when no exact match", () => {
    const result = orderYahooSearchMatches(
      [
        { symbol: "BBB", name: "B", marketCap: 200 },
        { symbol: "AAA", name: "A" },
        { symbol: "CCC", name: "C", marketCap: 300 },
      ],
      "msft",
    );

    expect(result).toEqual([
      { symbol: "CCC", name: "C" },
      { symbol: "BBB", name: "B" },
      { symbol: "AAA", name: "A" },
    ]);
  });
});
