import { z } from "zod";

export const hyperliquidAddressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const decimal = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/)
  .refine((value) => Number(value) !== 0 || !/[1-9]/.test(value))
  .transform(Number)
  .pipe(z.number().finite());
const index = z.number().int().nonnegative();

export const hyperliquidModeSchema = z.enum(["disabled", "unifiedAccount"]);
export const hyperliquidRoleSchema = z.object({ role: z.literal("user") });
export const hyperliquidSubaccountsSchema = z
  .array(z.unknown())
  .length(0)
  .nullable();
export const hyperliquidLendingSchema = z.object({
  tokenToState: z.array(
    z.tuple([
      index,
      z.object({
        borrow: z.object({ value: decimal.refine((n) => n === 0) }),
        supply: z.object({ value: decimal.refine((n) => n === 0) }),
      }),
    ]),
  ),
});
export const hyperliquidDexsSchema = z
  .array(z.object({ name: z.string().min(1) }).nullable())
  .refine(
    (dexs) =>
      dexs.length > 0 && dexs[0] === null && dexs.slice(1).every(Boolean),
  )
  .refine(
    (dexs) => new Set(dexs.map((dex) => dex?.name ?? "")).size === dexs.length,
  );
export const hyperliquidPerpsSchema = z.object({
  marginSummary: z.object({ accountValue: decimal }),
  assetPositions: z.array(z.object({ position: z.object({ szi: decimal }) })),
});
export const hyperliquidPerpMetaSchema = z.tuple([
  z.object({ collateralToken: index }),
  z.array(z.unknown()),
]);

const spotSchema = z.object({
  balances: z.array(
    z.object({
      token: index,
      total: decimal,
      hold: decimal.pipe(z.number().nonnegative()),
    }),
  ),
});
const marketsSchema = z.tuple([
  z.object({
    tokens: z.array(z.object({ index, name: z.string(), tokenId: z.string() })),
    universe: z.array(z.object({ index, tokens: z.tuple([index, index]) })),
  }),
  z.array(z.object({ markPx: z.unknown() })),
]);
const vaultsSchema = z.array(
  z.object({ vaultAddress: hyperliquidAddressSchema, equity: decimal }),
);

// API docs (verified September 2026): /trading/account-abstraction-modes and
// /for-developers/api/info-endpoint/{spot,perpetuals}. Unified balances already
// include perp collateral/equity. Holds and entryNtl are not additional assets.
// USD here is Hyperliquid's USDC accounting denomination (USDC at par), not a
// fiat redemption quote. Never apply that convention to other stablecoins.
export const calculateHyperliquidBalanceUsd = (
  spotPayload: unknown,
  marketsPayload: unknown,
  vaultsPayload: unknown,
  perpsEquityUsd: number,
): number => {
  const spot = spotSchema.safeParse(spotPayload);
  const markets = marketsSchema.safeParse(marketsPayload);
  const vaults = vaultsSchema.safeParse(vaultsPayload);
  if (
    !spot.success ||
    !markets.success ||
    !vaults.success ||
    !Number.isFinite(perpsEquityUsd)
  )
    throw new Error("Invalid Hyperliquid valuation response");
  const [meta, contexts] = markets.data;
  if (
    meta.universe.length !== contexts.length ||
    new Set(meta.tokens.map((token) => token.index)).size !==
      meta.tokens.length ||
    new Set(meta.universe.map((pair) => pair.index)).size !==
      meta.universe.length ||
    new Set(spot.data.balances.map((balance) => balance.token)).size !==
      spot.data.balances.length ||
    new Set(vaults.data.map((vault) => vault.vaultAddress.toLowerCase()))
      .size !== vaults.data.length
  )
    throw new Error("Invalid Hyperliquid duplicate or mismatched data");
  const usdc = meta.tokens.find((token) => token.index === 0);
  if (
    usdc?.name !== "USDC" ||
    usdc.tokenId.toLowerCase() !== "0x6d1e7cde53ba9467b783cb7c530ce054"
  )
    throw new Error("Invalid Hyperliquid USDC identity");
  let total = perpsEquityUsd;
  for (const balance of spot.data.balances) {
    if (balance.total < 0 || balance.hold > balance.total)
      throw new Error("Unsupported Hyperliquid spot liability or hold");
    if (balance.total === 0) continue;
    if (!meta.tokens.some((token) => token.index === balance.token))
      throw new Error("Unknown Hyperliquid spot token");
    if (balance.token === 0) {
      total += balance.total;
      continue;
    }
    // Match token IDs, not symbols or pair indices. Contexts follow universe order.
    const pairs = meta.universe.flatMap((pair, position) =>
      pair.tokens[0] === balance.token && pair.tokens[1] === 0
        ? [position]
        : [],
    );
    if (pairs.length !== 1)
      throw new Error("Unsupported Hyperliquid spot pricing route");
    const price = decimal
      .pipe(z.number().positive())
      .safeParse(contexts[pairs[0]].markPx);
    if (!price.success) throw new Error("Invalid Hyperliquid spot price");
    const value = balance.total * price.data;
    if (!Number.isFinite(value) || value === 0)
      throw new Error("Invalid Hyperliquid spot value");
    total += value;
  }
  for (const vault of vaults.data) {
    if (vault.equity < 0)
      throw new Error("Unsupported Hyperliquid negative vault equity");
    total += vault.equity;
  }
  if (!Number.isFinite(total) || total < 0)
    throw new Error("Invalid Hyperliquid total equity");
  return total;
};
