import { z } from "zod";

const stateSchema = z.object({
  marginSummary: z.object({
    accountValue: z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .refine((value) => Number(value) !== 0 || !/[1-9]/.test(value))
      .transform(Number)
      .pipe(z.number().finite().nonnegative()),
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
  if (!state.success) throw new Error("Invalid Hyperliquid perpetual equity");
  if (!metadataSchema.safeParse(metadataPayload).success)
    throw new Error("Invalid or non-USDC Hyperliquid perpetual collateral");
  const total = state.data.marginSummary.accountValue;
  if (!Number.isSafeInteger(Math.round(total * 100)))
    throw new Error("Invalid Hyperliquid equity cents");
  return total;
};
