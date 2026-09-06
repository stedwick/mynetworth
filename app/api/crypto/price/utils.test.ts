import { describe, expect, it } from "bun:test";
import { parseYahooCryptoQuotes } from "@/app/api/stocks/price/utils";
import {
  parseAnkrBtcPriceUsd,
  parseAnkrTokenPriceUsd,
  parseSymbolsParam,
} from "./utils";

describe("parseSymbolsParam", () => {
  it("normalizes, trims, and de-duplicates symbols", () => {
    expect(parseSymbolsParam(" btc, ETH , ,btc ")).toEqual(["BTC", "ETH"]);
    expect(parseSymbolsParam(null)).toEqual([]);
    expect(parseSymbolsParam(" , ")).toEqual([]);
  });
});

describe("Ankr prices", () => {
  it("parses positive token and BTC prices", () => {
    expect(parseAnkrTokenPriceUsd({ usdPrice: "1234.56" })).toBe(1234.56);
    expect(parseAnkrTokenPriceUsd({ usdPrice: 1 })).toBe(1);
    expect(
      parseAnkrBtcPriceUsd({ ts: 1_788_000_000, rates: { usd: 60000 } }),
    ).toBe(60000);
  });

  it.each([
    undefined,
    null,
    0,
    "0",
    -1,
    NaN,
    Infinity,
    "",
    " ",
    "1USD",
    "0x10",
    "1e309",
    true,
  ])("rejects missing or invalid prices without a $1 fallback: %p", (value) => {
    expect(() => parseAnkrTokenPriceUsd({ usdPrice: value })).toThrow();
    expect(() =>
      parseAnkrBtcPriceUsd({ ts: 1_788_000_000, rates: { usd: value } }),
    ).toThrow();
  });

  it("rejects malformed ticker envelopes and Blockbook error payloads", () => {
    for (const payload of [
      { rates: { usd: 1 } },
      { ts: 1, rates: {} },
      { ts: 1, rates: { usd: 1 }, error: "bad" },
    ]) {
      expect(() => parseAnkrBtcPriceUsd(payload)).toThrow();
    }
  });
});

it("validates exact Yahoo crypto USD quotes with optional usable market times", () => {
  const quote = {
    symbol: "ZEC-USD",
    quoteType: "CRYPTOCURRENCY",
    currency: "USD",
    regularMarketPrice: 42,
  };
  for (const regularMarketTime of [
    undefined,
    null,
    new Date("2026-01-01"),
    1_788_000_000,
  ]) {
    const value = { ...quote, regularMarketTime };
    expect(parseYahooCryptoQuotes([value], ["ZEC-USD"])).toEqual([value]);
  }
  expect(() => parseYahooCryptoQuotes([quote], ["FIL-USD"])).toThrow();
  expect(() =>
    parseYahooCryptoQuotes([{ ...quote, currency: "EUR" }], ["ZEC-USD"]),
  ).toThrow();
});
