import { describe, expect, it } from "bun:test";
import {
  mapMobulaAllAssetsToSymbols,
  mapMobulaAssetsToPrices,
  mobulaAllDataSchema,
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

describe("mobulaAllDataSchema", () => {
  it("accepts a data payload", () => {
    const result = mobulaAllDataSchema.parse({
      data: [
        {
          symbol: "BTC",
          name: "Bitcoin",
          market_cap: 1000,
          extra: true,
        },
      ],
    });

    expect(result.data[0]).toEqual({
      symbol: "BTC",
      name: "Bitcoin",
      market_cap: 1000,
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

describe("mapMobulaAllAssetsToSymbols", () => {
  it("normalizes symbols and skips empty values", () => {
    const result = mapMobulaAllAssetsToSymbols([
      { symbol: " btc ", name: "Bitcoin", market_cap: 1000 },
      { symbol: "ETH", name: "Ethereum", market_cap: null },
      { symbol: "btc", name: "Bitcoin Duplicate" },
      null,
      { symbol: "" },
    ]);

    expect(result).toEqual([
      { symbol: "BTC", name: "Bitcoin", marketCap: 1000 },
      { symbol: "ETH", name: "Ethereum", marketCap: undefined },
    ]);
  });

  it("keeps the highest market cap when symbols collide", () => {
    const result = mapMobulaAllAssetsToSymbols([
      { symbol: "btc", name: "Smaller BTC", market_cap: 50 },
      { symbol: "BTC", name: "Bitcoin", market_cap: 1000 },
      { symbol: "BTC", name: "No Cap" },
    ]);

    expect(result).toEqual([
      { symbol: "BTC", name: "Bitcoin", marketCap: 1000 },
    ]);
  });
});
