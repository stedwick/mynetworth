import { expect, it } from "bun:test";
import { calculateHyperliquidBalanceUsd } from "./hyperliquid";

const metadata = [{ collateralToken: 0 }, []];

it("reads only marginSummary account equity, including verified zero and fractional cents", () => {
  for (const value of ["0", "100.125", "90071992547409"]) {
    expect(
      calculateHyperliquidBalanceUsd(
        {
          marginSummary: { accountValue: value, totalNtlPos: "100000" },
          crossMarginSummary: { accountValue: "90" },
          withdrawable: "50",
          assetPositions: [{ position: { unrealizedPnl: "10" } }],
        },
        metadata,
      ),
    ).toBe(Number(value));
  }
});

it.each([
  null,
  100,
  "",
  " ",
  "NaN",
  "Infinity",
  "0x10",
  "1e3",
  "-1",
  "90071992547410",
  "9".repeat(400),
  `0.${"0".repeat(400)}1`,
])("rejects invalid or unsafe equity %p", (accountValue) => {
  expect(() =>
    calculateHyperliquidBalanceUsd(
      { marginSummary: { accountValue } },
      metadata,
    ),
  ).toThrow();
});

it("rejects missing equity and unverified USDC collateral even for zero", () => {
  for (const state of [null, {}, { marginSummary: {} }])
    expect(() => calculateHyperliquidBalanceUsd(state, metadata)).toThrow();
  for (const meta of [
    null,
    [],
    [{}, []],
    [{ collateralToken: 1 }, []],
    [{ collateralToken: "0" }, []],
  ])
    expect(() =>
      calculateHyperliquidBalanceUsd(
        { marginSummary: { accountValue: "0" } },
        meta,
      ),
    ).toThrow("collateral");
});
