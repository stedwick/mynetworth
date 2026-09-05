import { describe, expect, it } from "bun:test";
import {
  cryptoAssets,
  getCryptoAsset,
  isSupportedCryptoSymbol,
} from "@/app/lib/crypto-assets";
import { GET } from "./route";
import { parseSearchQueryParam, searchCryptoAssets } from "./utils";

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
    ]);
    expect(new Set(cryptoAssets.map(({ symbol }) => symbol)).size).toBe(
      cryptoAssets.length,
    );
    for (const asset of cryptoAssets) {
      expect(isSupportedCryptoSymbol(asset.symbol)).toBe(true);
      if ("contractAddress" in asset)
        expect(asset.contractAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
    for (const symbol of [
      "SOL",
      "S",
      "MON",
      "MATIC",
      "fakeBTC",
      "",
      "__proto__",
    ]) {
      expect(isSupportedCryptoSymbol(symbol)).toBe(false);
      expect(getCryptoAsset(symbol)).toBeUndefined();
    }
    expect(isSupportedCryptoSymbol(" eth ")).toBe(true);
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
});

describe("crypto search", () => {
  it("trims queries and requires at least two characters", () => {
    for (const query of [null, "   ", "b"])
      expect(parseSearchQueryParam(query)).toBeNull();
    expect(parseSearchQueryParam("  btc ")).toBe("btc");
  });

  it("matches symbols and names with exact matches first, then limits", () => {
    expect(searchCryptoAssets(" btc ")).toEqual([
      { symbol: "BTC", name: "Bitcoin" },
      { symbol: "WBTC", name: "Wrapped Bitcoin" },
    ]);
    expect(searchCryptoAssets("bitcoin", 1)).toEqual([
      { symbol: "BTC", name: "Bitcoin" },
    ]);
    expect(searchCryptoAssets("wbtc", 1)).toEqual([
      { symbol: "WBTC", name: "Wrapped Bitcoin" },
    ]);
    expect(searchCryptoAssets("eth")[0]).toEqual({
      symbol: "ETH",
      name: "Ethereum",
    });
    expect(searchCryptoAssets("btc", 0)).toEqual([]);
    expect(searchCryptoAssets(" ")).toEqual([]);
  });

  it("cannot introduce provider catalog duplicates or disabled tokens", () => {
    for (const query of ["sol", "sonic", "monad", "fraudulent bitcoin"])
      expect(searchCryptoAssets(query)).toEqual([]);
    expect(
      searchCryptoAssets("eth").filter(({ symbol }) => symbol === "ETH"),
    ).toHaveLength(1);
    for (const match of searchCryptoAssets("a"))
      expect(Object.keys(match).sort()).toEqual(["name", "symbol"]);
  });

  it("serves the public search contract without credentials or provider access", async () => {
    const response = await GET(
      new Request("https://example.test/api/crypto/search?q=usdc"),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { symbol: "USDC", name: "USD Coin" },
    ]);
    expect(
      (await GET(new Request("https://example.test/api/crypto/search?q=s")))
        .status,
    ).toBe(400);
    expect(
      await (
        await GET(new Request("https://example.test/api/crypto/search?q=sol"))
      ).json(),
    ).toEqual([]);
  });
});
