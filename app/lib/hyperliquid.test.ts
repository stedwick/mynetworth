import { expect, it } from "bun:test";
import {
  calculateHyperliquidBalanceUsd,
  calculateHyperliquidSharedUsdcUsd,
} from "./hyperliquid";

const metadata = [{ collateralToken: 0 }, []];
const usdc = { coin: "USDC", token: 0, total: "100.125", hold: "40" };

it("reads shared USDC total once, including hold, ignoring unrelated amounts", () => {
  expect(
    calculateHyperliquidSharedUsdcUsd({
      balances: [
        usdc,
        { coin: "HYPE", token: 150, total: "invalid", hold: null },
        { coin: "PURR", token: 1 },
      ],
      marginSummary: { accountValue: "999" },
    }),
  ).toBe(100.125);
});

it("accepts verified shared USDC zero or absence from a valid list", () => {
  for (const balances of [
    [],
    [{ coin: "HYPE", token: 150 }],
    [{ ...usdc, total: "0", hold: "0" }],
  ])
    expect(calculateHyperliquidSharedUsdcUsd({ balances })).toBe(0);
});

it.each([
  null,
  {},
  { balances: null },
  { balances: {} },
  ...[
    null,
    {},
    { coin: "HYPE" },
    { token: 1 },
    { coin: "HYPE", token: "0" },
  ].map((entry) => ({ balances: [entry] })),
  { balances: [usdc, usdc] },
  { balances: [{ ...usdc, coin: "HYPE" }] },
  { balances: [{ ...usdc, token: 1 }] },
  { balances: [usdc, { ...usdc, token: 1 }] },
  { balances: [usdc, { ...usdc, coin: "HYPE" }] },
  ...[
    undefined,
    null,
    10,
    "",
    " ",
    "NaN",
    "Infinity",
    "-1",
    "0x10",
    "1e3",
    "90071992547410",
    "9".repeat(400),
    `0.${"0".repeat(400)}1`,
  ].map((total) => ({ balances: [{ ...usdc, total }] })),
  ...[undefined, null, "bad", "-1"].map((hold) => ({
    balances: [{ ...usdc, hold }],
  })),
])("rejects malformed, ambiguous or unsafe shared USDC %p", (payload) => {
  expect(() => calculateHyperliquidSharedUsdcUsd(payload)).toThrow();
});

it("explicitly rejects unified debt rather than fabricating zero", () => {
  expect(() =>
    calculateHyperliquidSharedUsdcUsd({
      balances: [{ ...usdc, total: "-10" }],
    }),
  ).toThrow("negative balances/debt unsupported");
});

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
