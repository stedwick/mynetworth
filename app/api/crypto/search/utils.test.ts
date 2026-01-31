import { describe, expect, it } from "bun:test";
import {
  filterMobulaSymbols,
  parseSearchQueryParam,
  orderMobulaMatches,
  sortMobulaMatchesByMarketCap,
} from "./utils";

describe("parseSearchQueryParam", () => {
  it("returns null for empty input", () => {
    expect(parseSearchQueryParam(null)).toBeNull();
    expect(parseSearchQueryParam("   ")).toBeNull();
    expect(parseSearchQueryParam("b")).toBeNull();
  });

  it("trims the query string", () => {
    expect(parseSearchQueryParam("  btc ")).toBe("btc");
  });
});

describe("filterMobulaSymbols", () => {
  it("filters symbols by query and respects the limit", () => {
    const result = filterMobulaSymbols(
      [
        { symbol: "BTC", name: "Bitcoin", marketCap: 1000 },
        { symbol: "ETH", name: "Ethereum" },
        { symbol: "WBTC", name: "Wrapped Bitcoin", marketCap: 500 },
        { symbol: "USDT", name: "Tether" },
        { symbol: "BTG", name: "Bitcoin Gold" },
      ],
      "bt",
      2,
    );

    expect(result).toEqual([
      { symbol: "BTC", name: "Bitcoin", marketCap: 1000 },
      { symbol: "WBTC", name: "Wrapped Bitcoin", marketCap: 500 },
    ]);
  });

  it("matches on name as well as symbol", () => {
    const result = filterMobulaSymbols(
      [
        { symbol: "BTC", name: "Bitcoin", marketCap: 1000 },
        { symbol: "CBTC", name: "Coinbase Wrapped BTC", marketCap: 200 },
        { symbol: "ETH", name: "Ethereum", marketCap: 900 },
      ],
      "coinbase",
      10,
    );

    expect(result).toEqual([
      { symbol: "CBTC", name: "Coinbase Wrapped BTC", marketCap: 200 },
    ]);
  });

  it("returns an empty array for empty query or limit", () => {
    expect(
      filterMobulaSymbols([{ symbol: "BTC", name: "Bitcoin" }], "  ", 10),
    ).toEqual([]);
    expect(
      filterMobulaSymbols([{ symbol: "BTC", name: "Bitcoin" }], "btc", 0),
    ).toEqual([]);
  });
});

describe("sortMobulaMatchesByMarketCap", () => {
  it("sorts by market cap descending, then symbol", () => {
    const result = sortMobulaMatchesByMarketCap([
      { symbol: "AAA", name: "A" },
      { symbol: "CCC", name: "C", marketCap: 200 },
      { symbol: "BBB", name: "B", marketCap: 200 },
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

describe("orderMobulaMatches", () => {
  it("places an exact symbol match first then sorts the rest", () => {
    const result = orderMobulaMatches(
      [
        { symbol: "WBTC", name: "Wrapped Bitcoin", marketCap: 500 },
        { symbol: "BTC", name: "Bitcoin", marketCap: 1000 },
        { symbol: "BTG", name: "Bitcoin Gold", marketCap: 50 },
      ],
      "btc",
    );

    expect(result).toEqual([
      { symbol: "BTC", name: "Bitcoin", marketCap: 1000 },
      { symbol: "WBTC", name: "Wrapped Bitcoin", marketCap: 500 },
      { symbol: "BTG", name: "Bitcoin Gold", marketCap: 50 },
    ]);
  });

  it("falls back to market cap sorting when no exact match", () => {
    const result = orderMobulaMatches(
      [
        { symbol: "WBTC", name: "Wrapped Bitcoin", marketCap: 500 },
        { symbol: "BTC", name: "Bitcoin", marketCap: 1000 },
        { symbol: "BTG", name: "Bitcoin Gold", marketCap: 50 },
      ],
      "eth",
    );

    expect(result).toEqual([
      { symbol: "BTC", name: "Bitcoin", marketCap: 1000 },
      { symbol: "WBTC", name: "Wrapped Bitcoin", marketCap: 500 },
      { symbol: "BTG", name: "Bitcoin Gold", marketCap: 50 },
    ]);
  });
});
