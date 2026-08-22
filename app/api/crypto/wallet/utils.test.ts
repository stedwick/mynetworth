import { describe, expect, it } from "bun:test";
import {
  convertBtcToUsd,
  extractMoralisBtcBalance,
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
      result: [
        {
          balanceRaw: "133916752",
          chainId: "bitcoin-mainnet",
          decimals: 8,
          nativeToken: true,
          symbol: "BTC",
          usdValue: 84411.75,
        },
      ],
    });

    expect(result.cursor).toBe("next-page");
    expect(result.result).toHaveLength(1);
  });

  it("accepts a null cursor", () => {
    const result = parseMoralisWalletTokens({ cursor: null, result: [] });

    expect(result.cursor).toBeNull();
  });
});

describe("extractMoralisBtcBalance", () => {
  it("uses the raw native BTC balance and ignores provider USD values", () => {
    const balance = extractMoralisBtcBalance({
      cursor: null,
      result: [
        {
          balanceRaw: "133916752",
          chainId: "bitcoin-mainnet",
          decimals: 8,
          nativeToken: true,
          symbol: "BTC",
          usdValue: 84411.75,
        },
        {
          balanceRaw: "100000000",
          chainId: "bitcoin-mainnet",
          decimals: 8,
          nativeToken: false,
          symbol: "OTHER",
          usdValue: 999999,
        },
      ],
    });

    expect(balance).toBe(1.33916752);
  });

  it("returns zero when the wallet has no native BTC", () => {
    expect(extractMoralisBtcBalance({ cursor: null, result: [] })).toBe(0);
  });
});

describe("convertBtcToUsd", () => {
  it("converts a BTC balance with an independent USD price", () => {
    expect(convertBtcToUsd(1.33916752, 77204.78456156605)).toBeCloseTo(
      103390.14,
      2,
    );
  });

  it("rejects invalid balances and prices", () => {
    expect(() => convertBtcToUsd(-1, 77204.78)).toThrow(
      "BTC value inputs invalid",
    );
    expect(() => convertBtcToUsd(1, 0)).toThrow("BTC value inputs invalid");
  });
});

describe("mapWalletBalanceToResponse", () => {
  it("maps the balance to the address key", () => {
    const result = mapWalletBalanceToResponse("0xabc", 99.5);

    expect(result).toEqual({ "0xabc": 99.5 });
  });
});
