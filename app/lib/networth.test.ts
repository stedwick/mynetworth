import { describe, expect, test } from "bun:test";

import {
  computeNetWorthSummary,
  getAssetTotal,
  getAssetHyperliquidBalance,
  type AssetItem,
} from "./networth";

describe("getAssetTotal", () => {
  test("adds eligible safe-cent balances once without changing normal quantity semantics", () => {
    const wallet: AssetItem = {
      id: "wallet",
      ticker: "ETH",
      name: "Wallet",
      kind: "wallet",
      walletNetwork: "evm",
      price: 100,
      quantity: 1,
      hyperliquidEnabled: true,
      hyperliquidBalanceCents: "12345",
    };
    expect(getAssetTotal(wallet)).toBe(223.45);
    expect(getAssetTotal({ ...wallet, quantity: 2 })).toBe(323.45);
    expect(
      getAssetHyperliquidBalance({ ...wallet, hyperliquidBalanceCents: "0" }),
    ).toBe(0);
    for (const balance of [
      null,
      undefined,
      "",
      " ",
      "-1",
      "1.5",
      "NaN",
      "Infinity",
      "9007199254740992",
    ]) {
      const item = { ...wallet, hyperliquidBalanceCents: balance };
      expect(getAssetHyperliquidBalance(item)).toBeNull();
      expect(getAssetTotal(item)).toBe(100);
    }
    for (const item of [
      { ...wallet, hyperliquidEnabled: false },
      { ...wallet, walletNetwork: "bitcoin" as const },
      { ...wallet, walletNetwork: "solana" as const },
      { ...wallet, kind: "stock" as const },
      { ...wallet, kind: "crypto" as const },
      { ...wallet, kind: "manual" as const },
    ]) {
      expect(getAssetHyperliquidBalance(item)).toBeNull();
      expect(getAssetTotal(item)).toBe(100);
    }
  });
  test("calculates the total value for an asset", () => {
    expect(
      getAssetTotal({
        id: "stock-aapl",
        ticker: "AAPL",
        name: "Apple",
        price: 200,
        quantity: 5,
        kind: "stock",
      }),
    ).toBe(1000);
  });
});

describe("computeNetWorthSummary", () => {
  test("sums category totals and net worth", () => {
    const summary = computeNetWorthSummary([
      {
        id: "stocks",
        label: "Stocks",
        items: [
          {
            id: "stock-aapl",
            ticker: "AAPL",
            name: "Apple",
            price: 200,
            quantity: 5,
            kind: "stock",
          },
          {
            id: "stock-tsla",
            ticker: "TSLA",
            name: "Tesla",
            price: 250,
            quantity: 2,
            kind: "stock",
          },
        ],
      },
      {
        id: "crypto",
        label: "Crypto",
        items: [
          {
            id: "crypto-btc",
            ticker: "BTC",
            name: "Bitcoin",
            price: 40000,
            quantity: 0.5,
            kind: "crypto",
          },
        ],
      },
    ]);

    expect(summary.categoryTotals).toEqual({
      stocks: 1500,
      crypto: 20000,
    });
    expect(summary.netWorth).toBe(21500);
  });
});
