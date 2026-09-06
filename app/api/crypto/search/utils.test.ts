import { describe, expect, it } from "bun:test";
import {
  cryptoAssets,
  getCryptoAsset,
  isValidCryptoSymbol,
  usesAnkrCryptoPrice,
} from "@/app/lib/crypto-assets";
import {
  getCryptoSearchQueries,
  mapYahooCryptoSearchResults,
  parseSearchQueryParam,
} from "./utils";

describe("canonical crypto catalog", () => {
  it("contains unique canonical identities and excludes disabled chains", () => {
    expect(cryptoAssets.map(({ symbol }) => symbol)).toEqual([
      "BTC",
      "ETH",
      "BNB",
      "AVAX",
      "POL",
      "USDC",
      "USDT",
      "DAI",
      "LINK",
      "UNI",
      "AAVE",
      "ARB",
      "OP",
      "WBTC",
      "SOL",
      "ZEC",
      "TRX",
      "FIL",
    ]);
    expect(new Set(cryptoAssets.map(({ symbol }) => symbol)).size).toBe(
      cryptoAssets.length,
    );
    for (const asset of cryptoAssets) {
      expect(isValidCryptoSymbol(asset.symbol)).toBe(true);
      expect(usesAnkrCryptoPrice(asset.symbol)).toBe(
        asset.blockchain !== "yahoo",
      );
      if ("contractAddress" in asset)
        expect(asset.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
    for (const symbol of [
      "",
      "__proto__",
      "A/B",
      "A?KEY=secret",
      "A\nB",
      "SOL\n",
      "A".repeat(33),
    ]) {
      expect(isValidCryptoSymbol(symbol)).toBe(false);
      expect(getCryptoAsset(symbol)).toBeUndefined();
    }
    expect(isValidCryptoSymbol(" eth ")).toBe(true);
    expect(getCryptoAsset("USDC")).toEqual({
      symbol: "USDC",
      name: "USD Coin",
      blockchain: "eth",
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    });
    expect(getCryptoAsset("BTC")).toEqual({
      symbol: "BTC",
      name: "Bitcoin",
      blockchain: "btc",
    });
  });

  it("constructs Yahoo USD pairs for valid unmapped tickers without duplicating USD", () => {
    for (const symbol of [
      "S",
      "MON",
      "MATIC",
      "FAKEBTC",
      "ABC-DEF",
      "ABC.X",
      "A".repeat(32),
    ]) {
      expect(getCryptoAsset(` ${symbol.toLowerCase()} `)).toEqual({
        symbol,
        name: symbol,
        blockchain: "yahoo",
        yahooSymbol: `${symbol}-USD`,
      });
      expect(usesAnkrCryptoPrice(symbol)).toBe(false);
    }
    expect(getCryptoAsset("xxx-usd")).toEqual({
      symbol: "XXX-USD",
      name: "XXX-USD",
      blockchain: "yahoo",
      yahooSymbol: "XXX-USD",
    });
  });
});

describe("crypto search", () => {
  it("trims queries and requires at least two characters", () => {
    for (const query of [null, "   ", "b"])
      expect(parseSearchQueryParam(query)).toBeNull();
    expect(parseSearchQueryParam("  btc ")).toBe("btc");
  });

  it.each([
    [" near ", ["near", "NEAR-USD"]],
    [" NEAR-USD ", ["NEAR-USD"]],
    ["sui20947-usd", ["sui20947-usd"]],
    [" NEAR Protocol ", ["NEAR Protocol"]],
    ["Wrapped Bitcoin", ["Wrapped Bitcoin"]],
  ] as const)("plans provider queries for %s", (query, expected) => {
    expect(getCryptoSearchQueries(query)).toEqual([...expected]);
  });

  const cryptoQuote = (symbol: string, longname?: string) => ({
    symbol,
    longname,
    quoteType: "CRYPTOCURRENCY",
    isYahooFinance: true,
    currency: "USD",
  });

  it("puts the supplemental exact pair first and preserves other provider ordering", () => {
    const quotes = [
      cryptoQuote("ZNEAR-USD", "Other USD"),
      cryptoQuote("ANEAR-USD", "Another USD"),
      cryptoQuote(" near-usd ", "NEAR Protocol USD"),
      cryptoQuote("NEAR-USD", "Duplicate USD"),
    ];
    for (const query of [" near ", "near-usd"]) {
      expect(mapYahooCryptoSearchResults(quotes, query)).toEqual([
        { symbol: "NEAR-USD", name: "NEAR Protocol" },
        { symbol: "ZNEAR-USD", name: "Other" },
        { symbol: "ANEAR-USD", name: "Another" },
      ]);
    }
  });

  it("retains exact Yahoo identities rather than selecting canonical Ankr assets", () => {
    const matches = mapYahooCryptoSearchResults(
      [
        cryptoQuote("SUI20947-USD", "Sui USD"),
        cryptoQuote("BTC-USD", "Bitcoin USD"),
      ],
      "Sui",
    );
    expect(matches).toEqual([
      { symbol: "SUI20947-USD", name: "Sui" },
      { symbol: "BTC-USD", name: "Bitcoin" },
    ]);
    for (const { symbol } of matches) {
      expect(getCryptoAsset(symbol)).toEqual({
        symbol,
        name: symbol,
        blockchain: "yahoo",
        yahooSymbol: symbol,
      });
      expect(usesAnkrCryptoPrice(symbol)).toBe(false);
    }
    expect(getCryptoAsset("BTC")?.blockchain).toBe("btc");
  });

  it("filters mixed, malformed and duplicate quotes before limiting", () => {
    expect(
      mapYahooCryptoSearchResults(
        [
          { ...cryptoQuote("STOCK-USD"), quoteType: "EQUITY" },
          cryptoQuote("BTC-EUR"),
          { ...cryptoQuote("EUR-USD"), currency: "EUR" },
          { ...cryptoQuote("TYPE-USD"), quoteType: undefined },
          { ...cryptoQuote("FALSE-USD"), isYahooFinance: false },
          { ...cryptoQuote("MISSING-USD"), isYahooFinance: undefined },
          ...["", "BTC", "A/B-USD", "A\nB-USD", `${"A".repeat(29)}-USD`].map(
            (symbol) => cryptoQuote(symbol),
          ),
          {
            ...cryptoQuote(" btc-usd ", "Bitcoin USD"),
            shortname: "Short USD",
          },
          cryptoQuote("BTC-USD", "Duplicate USD"),
          {
            ...cryptoQuote("SOL-USD"),
            currency: undefined,
            shortname: "Solana USD",
          },
          cryptoQuote("SUI20947-USD"),
        ],
        "coin",
        3,
      ),
    ).toEqual([
      { symbol: "BTC-USD", name: "Bitcoin" },
      { symbol: "SOL-USD", name: "Solana" },
      { symbol: "SUI20947-USD", name: undefined },
    ]);
  });

  it("applies default and explicit limits after exact ranking", () => {
    const quotes = Array.from({ length: 25 }, (_, index) =>
      cryptoQuote(`COIN${index}-USD`),
    );
    expect(mapYahooCryptoSearchResults(quotes, "coin24")).toHaveLength(20);
    expect(mapYahooCryptoSearchResults(quotes, "coin24", 1)).toEqual([
      { symbol: "COIN24-USD", name: undefined },
    ]);
    expect(mapYahooCryptoSearchResults(quotes, "coin24", 100)).toHaveLength(25);
    for (const limit of [0, -1])
      expect(mapYahooCryptoSearchResults(quotes, "coin24", limit)).toEqual([]);
    expect(mapYahooCryptoSearchResults(quotes, " ")).toEqual([]);
    expect(mapYahooCryptoSearchResults([], "coin")).toEqual([]);
  });
});
