import { describe, expect, it } from "bun:test";
import {
  extractBtcPriceUsd,
  convertSatoshisToUsd,
  extractWalletBalanceUsd,
  isBtcAddress,
  isEthAddress,
  isSolAddress,
  isSupportedWalletAddress,
  mapMobulaWalletBalancesToUsd,
  mapWalletBalanceToResponse,
  parseBtcUtxos,
  parseAddressParam,
  parseMobulaMarketData,
  parseMobulaWalletPortfolio,
  sumBtcUtxoSatoshis,
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

describe("parseBtcUtxos", () => {
  it("accepts a list of BTC UTXOs", () => {
    const result = parseBtcUtxos([
      { txid: "abc", vout: 0, value: 1200, status: { confirmed: true } },
    ]);

    expect(result).toHaveLength(1);
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

describe("extractBtcPriceUsd", () => {
  it("returns a positive finite BTC price", () => {
    const price = extractBtcPriceUsd(
      parseMobulaMarketData({
        data: {
          price: 70_571.64,
        },
      }),
    );

    expect(price).toBe(70_571.64);
  });

  it("throws when the BTC price is missing", () => {
    expect(() =>
      extractBtcPriceUsd(parseMobulaMarketData({ data: {} })),
    ).toThrow("BTC price missing");
  });

  it("throws when the BTC price is zero", () => {
    expect(() =>
      extractBtcPriceUsd(
        parseMobulaMarketData({
          data: {
            price: 0,
          },
        }),
      ),
    ).toThrow("BTC price missing");
  });

  it("throws when the BTC price is not finite", () => {
    expect(() =>
      extractBtcPriceUsd({
        data: {
          price: Number.POSITIVE_INFINITY,
        },
      }),
    ).toThrow("BTC price missing");
  });
});

describe("mapMobulaWalletBalancesToUsd", () => {
  it("maps array or record payloads to address balances", () => {
    const result = mapMobulaWalletBalancesToUsd({
      data: [
        {
          wallet: "0xabc",
          total_wallet_balance: 12.34,
        },
        {
          address: "So11111111111111111111111111111111111111112",
          balance_usd: 56.78,
        },
      ],
    });

    expect(result).toEqual({
      "0xabc": 12.34,
      So11111111111111111111111111111111111111112: 56.78,
    });

    const recordResult = mapMobulaWalletBalancesToUsd({
      data: {
        "0x396343362be2A4dA1cE0C1C210945346fb82Aa49": { balance_usd: 90.12 },
      },
    });

    expect(recordResult).toEqual({
      "0x396343362be2A4dA1cE0C1C210945346fb82Aa49": 90.12,
    });
  });

  it("maps wallet list payloads to address balances", () => {
    const result = mapMobulaWalletBalancesToUsd({
      data: {
        wallets: [
          {
            wallet: "0xfeed",
            total_wallet_balance: 44.55,
          },
        ],
      },
    });

    expect(result).toEqual({ "0xfeed": 44.55 });
  });

  it("maps wallet strings with balances record payloads", () => {
    const result = mapMobulaWalletBalancesToUsd({
      data: {
        wallets: ["0xabc"],
        balances: {
          "0xabc": { balance_usd: 12.34 },
        },
        balances_length: 1,
      },
    });

    expect(result).toEqual({ "0xabc": 12.34 });
  });

  it("maps a single wallet with total balance at the root", () => {
    const result = mapMobulaWalletBalancesToUsd({
      data: {
        wallets: ["0x396343362be2A4dA1cE0C1C210945346fb82Aa49"],
        total_wallet_balance: 99.99,
      },
    });

    expect(result).toEqual({
      "0x396343362be2A4dA1cE0C1C210945346fb82Aa49": 99.99,
    });
  });
});

describe("sumBtcUtxoSatoshis", () => {
  it("sums satoshi values and skips invalid entries", () => {
    const result = sumBtcUtxoSatoshis([
      { value: 1000 },
      { value: 2500 },
      { value: Number.NaN },
      {},
    ]);

    expect(result).toBe(3500);
  });
});

describe("convertSatoshisToUsd", () => {
  it("converts satoshis to USD using the BTC price", () => {
    expect(convertSatoshisToUsd(100_000_000, 50_000)).toBe(50_000);
  });
});

describe("mapWalletBalanceToResponse", () => {
  it("maps the balance to the address key", () => {
    const result = mapWalletBalanceToResponse("0xabc", 99.5);

    expect(result).toEqual({ "0xabc": 99.5 });
  });
});
