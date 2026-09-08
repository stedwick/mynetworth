import { expect, it } from "bun:test";
import { calculateHyperliquidBalanceUsd } from "./hyperliquid";

const fixture = () => ({
  spot: {
    balances: [
      { token: 0, total: "20", hold: "5", entryNtl: "9000" },
      { token: 150, total: "2", hold: "1", entryNtl: "8000" },
    ],
  },
  markets: [
    {
      tokens: [
        {
          index: 0,
          name: "USDC",
          tokenId: "0x6d1e7cde53ba9467b783cb7c530ce054",
        },
        { index: 150, name: "HYPE", tokenId: "0x123" },
      ],
      universe: [{ index: 107, tokens: [150, 0] }],
    },
    [{ markPx: "30", midPx: "99" }],
  ] as const,
  vaults: [{ vaultAddress: `0x${"b".repeat(40)}`, equity: "7" }],
});

it("adds marked spot totals, signed perps equity and vault equity without adding holds or entry cost", () => {
  const { spot, markets, vaults } = fixture();
  expect(calculateHyperliquidBalanceUsd(spot, markets, vaults, 100)).toBe(187);
  expect(calculateHyperliquidBalanceUsd(spot, markets, vaults, -10)).toBe(77);
});

it("accepts verified empty balances and zero unpriced tokens", () => {
  const { markets } = fixture();
  expect(calculateHyperliquidBalanceUsd({ balances: [] }, markets, [], 0)).toBe(
    0,
  );
  expect(
    calculateHyperliquidBalanceUsd(
      { balances: [{ token: 999, total: "0", hold: "0" }] },
      markets,
      [],
      0,
    ),
  ).toBe(0);
});

it.each([
  "",
  " ",
  "NaN",
  "Infinity",
  "0x10",
  "1e3",
  "-1",
  "9".repeat(400),
  `0.${"0".repeat(400)}1`,
])("rejects invalid spot quantity %s", (total) => {
  const { spot, markets, vaults } = fixture();
  spot.balances[0].total = total;
  expect(() =>
    calculateHyperliquidBalanceUsd(spot, markets, vaults, 0),
  ).toThrow();
});

it.each([null, "", "NaN", "0", "-1", 30])(
  "rejects missing or invalid mark %p",
  (markPx) => {
    const { spot, markets, vaults } = fixture();
    expect(() =>
      calculateHyperliquidBalanceUsd(
        spot,
        [markets[0], [{ markPx }]],
        vaults,
        0,
      ),
    ).toThrow();
  },
);

it("rejects duplicate identities, unknown tokens, non-USDC routes and metadata mismatch", () => {
  const { spot, markets, vaults } = fixture();
  const [meta, contexts] = markets;
  for (const invalid of [
    [{ ...meta, tokens: [...meta.tokens, meta.tokens[0]] }, contexts],
    [
      { ...meta, universe: [...meta.universe, meta.universe[0]] },
      [...contexts, ...contexts],
    ],
    [{ ...meta, universe: [{ index: 107, tokens: [150, 1] }] }, contexts],
    [{ ...meta, tokens: [meta.tokens[0]] }, contexts],
    [
      {
        ...meta,
        tokens: [{ ...meta.tokens[0], tokenId: "fake" }, meta.tokens[1]],
      },
      contexts,
    ],
    [meta, []],
  ])
    expect(() =>
      calculateHyperliquidBalanceUsd(spot, invalid, vaults, 0),
    ).toThrow();
  expect(() =>
    calculateHyperliquidBalanceUsd(
      { balances: [...spot.balances, spot.balances[0]] },
      markets,
      vaults,
      0,
    ),
  ).toThrow();
  expect(() =>
    calculateHyperliquidBalanceUsd(spot, markets, [...vaults, vaults[0]], 0),
  ).toThrow();
});

it("rejects invalid shapes, holds, negative vaults, negative totals and arithmetic overflow", () => {
  const { spot, markets, vaults } = fixture();
  expect(() =>
    calculateHyperliquidBalanceUsd({}, markets, vaults, 0),
  ).toThrow();
  expect(() =>
    calculateHyperliquidBalanceUsd(spot, markets, null, 0),
  ).toThrow();
  expect(() =>
    calculateHyperliquidBalanceUsd(
      spot,
      markets,
      [{ ...vaults[0], equity: "-1" }],
      0,
    ),
  ).toThrow();
  expect(() =>
    calculateHyperliquidBalanceUsd(spot, markets, vaults, -1000),
  ).toThrow();
  expect(() =>
    calculateHyperliquidBalanceUsd(spot, markets, vaults, Infinity),
  ).toThrow();
  spot.balances[0].hold = "21";
  expect(() =>
    calculateHyperliquidBalanceUsd(spot, markets, vaults, 0),
  ).toThrow();
  spot.balances[0].hold = "0";
  spot.balances[1].total = "9".repeat(308);
  expect(() =>
    calculateHyperliquidBalanceUsd(spot, markets, vaults, 0),
  ).toThrow();
});
