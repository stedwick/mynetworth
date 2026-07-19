import { describe, expect, it } from "bun:test";
import {
  extractNetWorthUsd,
  extractWalletBalanceUsd,
  isBtcAddress,
  isEthAddress,
  isSolAddress,
  isSupportedWalletAddress,
  mapWalletBalanceToResponse,
  parseAddressParam,
  parseMobulaWalletPortfolio,
  parseMoralisNetWorth,
  parseMoralisWalletTokens,
  sumMoralisTokenUsdValues,
} from "./utils";

describe("parseAddressParam", () => {
  it("trims the address and returns null for empty input", () => {
    expect(parseAddressParam(" 0xabc ")).toBe("0xabc");
    expect(parseAddressParam("   ")).toBeNull();
  });
});

describe("isEthAddress", () => {
  it("accepts valid ETH addresses", () => {
    expect(isEthAddress("0x396343362be2A4dA1cE0C1C210945346fb82Aa49")).toBe(
      true,
    );
  });

  it("rejects invalid ETH addresses", () => {
    expect(isEthAddress("0x123")).toBe(false);
    expect(isEthAddress("396343362be2A4dA1cE0C1C210945346fb82Aa49")).toBe(
      false,
    );
  });
});

describe("isBtcAddress", () => {
  it("accepts valid BTC addresses", () => {
    expect(isBtcAddress("1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4")).toBe(true);
    expect(isBtcAddress("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080")).toBe(
      true,
    );
  });

  it("rejects invalid BTC addresses", () => {
    expect(isBtcAddress("bc1")).toBe(false);
    expect(isBtcAddress("3O0O0O0O0O0O0O0O0O0O0O0O0O")).toBe(false);
  });
});

describe("isSolAddress", () => {
  it("accepts valid Solana addresses", () => {
    expect(isSolAddress("So11111111111111111111111111111111111111112")).toBe(
      true,
    );
  });

  it("rejects invalid Solana addresses", () => {
    expect(isSolAddress("So111")).toBe(false);
    expect(isSolAddress("0x396343362be2A4dA1cE0C1C210945346fb82Aa49")).toBe(
      false,
    );
  });
});

describe("isSupportedWalletAddress", () => {
  it("accepts ETH, SOL, or BTC addresses", () => {
    expect(
      isSupportedWalletAddress("0x396343362be2A4dA1cE0C1C210945346fb82Aa49"),
    ).toBe(true);
    expect(
      isSupportedWalletAddress("So11111111111111111111111111111111111111112"),
    ).toBe(true);
    expect(isSupportedWalletAddress("1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4")).toBe(
      true,
    );
  });

  it("rejects unknown address formats", () => {
    expect(isSupportedWalletAddress("not-an-address")).toBe(false);
  });
});

describe("parseMobulaWalletPortfolio", () => {
  it("accepts a wallet portfolio payload", () => {
    const result = parseMobulaWalletPortfolio({
      data: {
        total_wallet_balance: 1234.56,
        extra: "ok",
      },
    });

    expect(result.data.total_wallet_balance).toBe(1234.56);
  });
});

describe("extractWalletBalanceUsd", () => {
  it("prefers total_wallet_balance when available", () => {
    const balance = extractWalletBalanceUsd({
      data: {
        total_wallet_balance: 12.34,
      },
    });

    expect(balance).toBe(12.34);
  });

  it("falls back to balance_usd when total_wallet_balance is missing", () => {
    const balance = extractWalletBalanceUsd({
      data: {
        balance_usd: 56.78,
      },
    });

    expect(balance).toBe(56.78);
  });

  it("throws when no balance field is present", () => {
    expect(() => extractWalletBalanceUsd({ data: {} })).toThrow();
  });
});

describe("parseMoralisNetWorth", () => {
  it("accepts a net worth payload", () => {
    const result = parseMoralisNetWorth({
      total_networth_usd: "11679.84",
      chains: [],
    });

    expect(result.total_networth_usd).toBe("11679.84");
  });
});

describe("extractNetWorthUsd", () => {
  it("parses the net worth string to a number", () => {
    const netWorth = extractNetWorthUsd({
      total_networth_usd: "11679.84",
    });

    expect(netWorth).toBe(11679.84);
  });

  it("throws when the net worth is not numeric", () => {
    expect(() =>
      extractNetWorthUsd({ total_networth_usd: "not-a-number" }),
    ).toThrow("Net worth missing");
  });
});

describe("parseMoralisWalletTokens", () => {
  it("accepts a wallet tokens payload with a cursor", () => {
    const result = parseMoralisWalletTokens({
      cursor: "next-page",
      result: [{ usdValue: 10896.44, symbol: "BTC" }],
    });

    expect(result.cursor).toBe("next-page");
    expect(result.result).toHaveLength(1);
  });

  it("accepts a null cursor", () => {
    const result = parseMoralisWalletTokens({ cursor: null, result: [] });

    expect(result.cursor).toBeNull();
  });
});

describe("sumMoralisTokenUsdValues", () => {
  it("sums usd values and skips invalid entries", () => {
    const total = sumMoralisTokenUsdValues({
      cursor: null,
      result: [
        { usdValue: 100.5 },
        { usdValue: 200.25 },
        { usdValue: null },
        { usdValue: Number.NaN },
        {},
      ],
    });

    expect(total).toBe(300.75);
  });
});

describe("mapWalletBalanceToResponse", () => {
  it("maps the balance to the address key", () => {
    const result = mapWalletBalanceToResponse("0xabc", 99.5);

    expect(result).toEqual({ "0xabc": 99.5 });
  });
});
