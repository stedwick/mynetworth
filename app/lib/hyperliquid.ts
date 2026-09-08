import { z } from "zod";

// Only application-controlled reasons may use this type, never provider error text.
export class HyperliquidError extends Error {}

const balanceSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/)
  .refine((value) => Number(value) !== 0 || !/[1-9]/.test(value))
  .transform(Number)
  .pipe(z.number().finite().nonnegative());

const stateSchema = z.object({
  marginSummary: z.object({
    accountValue: balanceSchema,
  }),
});
const metadataSchema = z.tuple([
  z.object({ collateralToken: z.literal(0) }),
  z.array(z.unknown()),
]);

// Primary standard perpetual equity is denominated in USDC, valued at USD par.
export const calculateHyperliquidBalanceUsd = (
  statePayload: unknown,
  metadataPayload: unknown,
): number => {
  const state = stateSchema.safeParse(statePayload);
  if (!state.success)
    throw new HyperliquidError(
      "Invalid Hyperliquid perpetual equity (marginSummary.accountValue)",
    );
  if (!metadataSchema.safeParse(metadataPayload).success)
    throw new HyperliquidError(
      "Invalid or non-USDC Hyperliquid perpetual collateral (collateralToken)",
    );
  const total = state.data.marginSummary.accountValue;
  if (!Number.isSafeInteger(Math.round(total * 100)))
    throw new HyperliquidError(
      "Invalid Hyperliquid equity cents (unsafe integer)",
    );
  return total;
};

export const calculateHyperliquidSharedUsdcUsd = (payload: unknown): number => {
  const state = z
    .object({
      balances: z.array(
        z.looseObject({
          coin: z.string().min(1),
          token: z.number().int().nonnegative(),
        }),
      ),
    })
    .safeParse(payload);
  if (!state.success)
    throw new HyperliquidError("Invalid Hyperliquid shared USDC balances list");
  const matches = state.data.balances.filter(
    (balance) => balance.token === 0 || balance.coin === "USDC",
  );
  if (matches.length === 0) return 0;
  if (
    matches.length !== 1 ||
    matches[0].token !== 0 ||
    matches[0].coin !== "USDC"
  )
    throw new HyperliquidError(
      "Invalid Hyperliquid shared USDC identity or duplicate balance",
    );
  const balance = z
    .object({ total: balanceSchema, hold: balanceSchema })
    .safeParse(matches[0]);
  if (!balance.success)
    throw new HyperliquidError(
      "Invalid Hyperliquid shared USDC total or hold (negative balances/debt unsupported)",
    );
  // Total already includes held USDC; neither add hold nor sum perpetual equity.
  const total = balance.data.total;
  if (!Number.isSafeInteger(Math.round(total * 100)))
    throw new HyperliquidError(
      "Invalid Hyperliquid shared USDC cents (unsafe integer)",
    );
  return total;
};
