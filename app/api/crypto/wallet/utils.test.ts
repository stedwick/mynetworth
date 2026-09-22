import { describe, expect, it } from "bun:test";
import {
  ankrWalletBlockchains,
  isBtcAddress,
  isEthAddress,
  isSolAddress,
  isSupportedWalletAddress,
  mapWalletBalanceToResponse,
  parseAddressParam,
  parseAnkrBtcBalanceUsd,
  parseAnkrSolBalance,
  parseAnkrWalletBalanceUsd,
} from "./utils";

const walletResult = (totalBalanceUsd: unknown = "12.34") => ({
  totalBalanceUsd,
  assets: [{ balanceUsd: totalBalanceUsd }],
  syncStatus: {
    status: "synced",
    chains: ankrWalletBlockchains.map((blockchain) => ({
      blockchain,
      status: "synced",
      lag: "0s",
      timestamp: 1_788_000_000,
    })),
  },
});

describe("wallet address contracts", () => {
  it("trims address parameters and rejects empty input", () => {
    expect(parseAddressParam(" 0xabc ")).toBe("0xabc");
    expect(parseAddressParam("   ")).toBeNull();
    expect(parseAddressParam(null)).toBeNull();
  });

  it("supports BTC, EVM, and the existing Solana address format", () => {
    const eth = "0x396343362be2A4dA1cE0C1C210945346fb82Aa49";
    const sol = "So11111111111111111111111111111111111111112";
    expect(isEthAddress(eth)).toBe(true);
    expect(isSupportedWalletAddress(eth)).toBe(true);
    for (const btc of [
      "1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4",
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
    ]) {
      expect(isBtcAddress(btc)).toBe(true);
      expect(isSupportedWalletAddress(btc)).toBe(true);
    }
    expect(isSolAddress(sol)).toBe(true);
    expect(isSupportedWalletAddress(sol)).toBe(true);
    expect(isSolAddress("1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4")).toBe(true);
    expect(isSolAddress(eth)).toBe(false);
    expect(isEthAddress("0x123")).toBe(false);
    expect(isBtcAddress("bc1")).toBe(false);
    expect(isBtcAddress("3O0O0O0O0O0O0O0O0O0O0O0O0O")).toBe(false);
    expect(isSolAddress("So111")).toBe(false);
    expect(isSupportedWalletAddress("not-an-address")).toBe(false);
  });

  it("preserves address-keyed response values including zero", () => {
    expect(mapWalletBalanceToResponse("0xabc", 99.5)).toEqual({
      "0xabc": 99.5,
    });
    expect(mapWalletBalanceToResponse("0xabc", 0)).toEqual({ "0xabc": 0 });
  });
});

describe("parseAnkrWalletBalanceUsd", () => {
  it("uses a finite provider total and accepts a verified empty wallet", () => {
    expect(parseAnkrWalletBalanceUsd(walletResult())).toBe(12.34);
    expect(parseAnkrWalletBalanceUsd(walletResult(42))).toBe(42);
    expect(
      parseAnkrWalletBalanceUsd({ ...walletResult("0"), assets: [] }),
    ).toBe(0);
    expect(ankrWalletBlockchains).toHaveLength(16);
    for (const excluded of ["solana", "sonic", "monad", "xai"]) {
      expect(ankrWalletBlockchains).not.toContain(excluded);
    }
  });

  it.each([
    undefined,
    null,
    "",
    " ",
    "12USD",
    "0x10",
    "Infinity",
    Infinity,
    NaN,
    -1,
    "-1",
    true,
    "1e309",
  ])("rejects invalid or missing totals: %p", (value) => {
    expect(() =>
      parseAnkrWalletBalanceUsd({ ...walletResult(), totalBalanceUsd: value }),
    ).toThrow();
  });

  it("fails explicitly on unexpected pagination rather than summing a partial page", () => {
    expect(() =>
      parseAnkrWalletBalanceUsd({
        ...walletResult(),
        nextPageToken: "opaque-cursor",
      }),
    ).toThrow("pagination");
    expect(() =>
      parseAnkrWalletBalanceUsd({ ...walletResult(), nextPageToken: 1 }),
    ).toThrow("pagination");
    expect(
      parseAnkrWalletBalanceUsd({ ...walletResult(), nextPageToken: "" }),
    ).toBe(12.34);
  });

  it("rejects missing, duplicate, or unsynced chain coverage", () => {
    const result = walletResult();
    expect(() =>
      parseAnkrWalletBalanceUsd({ ...result, syncStatus: undefined }),
    ).toThrow();
    expect(() =>
      parseAnkrWalletBalanceUsd({
        ...result,
        syncStatus: { ...result.syncStatus, status: "syncing" },
      }),
    ).toThrow();
    expect(() =>
      parseAnkrWalletBalanceUsd({
        ...result,
        syncStatus: {
          status: "synced",
          chains: result.syncStatus.chains.slice(1),
        },
      }),
    ).toThrow("coverage");
    expect(() =>
      parseAnkrWalletBalanceUsd({
        ...result,
        syncStatus: {
          status: "synced",
          chains: [...result.syncStatus.chains, result.syncStatus.chains[0]],
        },
      }),
    ).toThrow("coverage");
    result.syncStatus.chains[0].status = "syncing";
    expect(() => parseAnkrWalletBalanceUsd(result)).toThrow();
  });

  it("accepts live unpriced-token entries without treating the total as missing", () => {
    expect(
      parseAnkrWalletBalanceUsd({
        ...walletResult(),
        assets: [{ balanceUsd: "12.34" }, { balanceUsd: "" }, {}],
      }),
    ).toBe(12.34);
  });

  it("rejects missing, malformed, and contradictory asset balances", () => {
    for (const assets of [undefined, [], [{ balanceUsd: "2garbage" }]]) {
      expect(() =>
        parseAnkrWalletBalanceUsd({ ...walletResult(), assets }),
      ).toThrow();
    }
    expect(() =>
      parseAnkrWalletBalanceUsd({
        ...walletResult("0"),
        assets: [{ balanceUsd: "1" }],
      }),
    ).toThrow("Inconsistent");
  });
});

describe("parseAnkrSolBalance", () => {
  it("converts native lamports to SOL without losing nine decimal places", () => {
    for (const [value, sol] of [
      [0, 0],
      [1, 0.000000001],
      [42_847_305_307, 42.847305307],
      [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER / 1e9],
    ]) {
      expect(parseAnkrSolBalance({ context: { slot: 123 }, value })).toBe(sol);
    }
  });

  it.each([
    undefined,
    null,
    "0",
    "1000000000",
    -1,
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
    true,
  ])("rejects malformed or unsafe lamports: %p", (value) => {
    expect(() =>
      parseAnkrSolBalance({ context: { slot: 123 }, value }),
    ).toThrow("Invalid Ankr SOL balance");
  });

  it.each([
    undefined,
    null,
    {},
    { value: 0 },
    { context: {}, value: 0 },
    { context: { slot: -1 }, value: 0 },
    { context: { slot: "123" }, value: 0 },
    { context: { slot: 1.5 }, value: 0 },
  ])("rejects missing or malformed RPC results: %p", (payload) => {
    expect(() => parseAnkrSolBalance(payload)).toThrow(
      "Invalid Ankr SOL balance",
    );
  });
});

describe("parseAnkrBtcBalanceUsd", () => {
  it("reads the USD valuation directly, not the satoshi amount", () => {
    expect(
      parseAnkrBtcBalanceUsd({ balance: "100000000", secondaryValue: 60000 }),
    ).toBe(60000);
    expect(
      parseAnkrBtcBalanceUsd({
        balance: "100000000",
        secondaryValue: "60000.25",
      }),
    ).toBe(60000.25);
  });

  it("accepts omitted fiat only for verified zero confirmed and no nonzero unconfirmed balance", () => {
    for (const balance of ["0", 0]) {
      expect(parseAnkrBtcBalanceUsd({ balance })).toBe(0);
      expect(parseAnkrBtcBalanceUsd({ balance, unconfirmedBalance: "0" })).toBe(
        0,
      );
      expect(parseAnkrBtcBalanceUsd({ balance, secondaryValue: 0 })).toBe(0);
    }
  });

  it.each([
    {},
    { secondaryValue: 1 },
    { balance: "1" },
    { balance: "1", secondaryValue: 0 },
    { balance: "0", unconfirmedBalance: "1" },
    { balance: "0", unconfirmedBalance: "-1", secondaryValue: 0 },
    { balance: "0", unconfirmedBalance: "garbage" },
    { balance: "0", unconfirmedBalance: null },
    { balance: "0", secondaryValue: null },
    { balance: "0", secondaryValue: "" },
    { balance: "0", secondaryValue: Infinity },
    { balance: "0", secondaryValue: -1 },
    { balance: "0", secondaryValue: "12.34garbage" },
    { balance: "0", error: "upstream failure" },
    { balance: "1.2", secondaryValue: 1 },
    { balance: "1sats", secondaryValue: 1 },
    { balance: "-1", secondaryValue: 1 },
    { balance: "9007199254740993", secondaryValue: 1 },
  ])("rejects ambiguous or malformed balances: %p", (payload) => {
    expect(() => parseAnkrBtcBalanceUsd(payload)).toThrow();
  });
});
