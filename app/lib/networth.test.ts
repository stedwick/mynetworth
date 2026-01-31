import { describe, expect, test } from "bun:test";

import { computeNetWorthSummary, getAssetTotal } from "./networth";

describe("getAssetTotal", () => {
  test("calculates the total value for an asset", () => {
    expect(
      getAssetTotal({
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
            ticker: "AAPL",
            name: "Apple",
            price: 200,
            quantity: 5,
            kind: "stock",
          },
          {
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
