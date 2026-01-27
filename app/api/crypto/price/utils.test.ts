import { describe, expect, it } from "bun:test";
import {
  mapMobulaAssetsToPrices,
  parseMobulaMultiData,
  parseSymbolsParam,
} from "./utils";

describe("parseSymbolsParam", () => {
  it("normalizes, trims, and de-duplicates symbols", () => {
    const result = parseSymbolsParam(" btc, ETH , ,btc ");

    expect(result).toEqual(["BTC", "ETH"]);
  });
});

describe("parseMobulaMultiData", () => {
  it("accepts a dataArray payload", () => {
    const result = parseMobulaMultiData({
      dataArray: [{ symbol: "BTC", price: 50000, extra: true }, null],
    });

    expect(result.dataArray?.[0]).toEqual({
      symbol: "BTC",
      price: 50000,
      extra: true,
    });
  });
});

describe("mapMobulaAssetsToPrices", () => {
  it("maps asset prices and skips missing values", () => {
    const result = mapMobulaAssetsToPrices([
      { symbol: "BTC", price: 50000 },
      { symbol: "ETH", price: null },
      null,
      { symbol: "SOL" },
      { symbol: "ada", price: 2.5 },
    ]);

    expect(result).toEqual({ BTC: 50000, ADA: 2.5 });
  });
});
