import { z } from "zod";

import { usdAmountSchema } from "../ankr-utils";

const positivePriceSchema = usdAmountSchema.pipe(z.number().positive());

export const parseAnkrTokenPriceUsd = (payload: unknown): number => {
  const parsed = z.object({ usdPrice: positivePriceSchema }).safeParse(payload);
  if (!parsed.success) throw new Error("Invalid Ankr token price");
  return parsed.data.usdPrice;
};

export const parseAnkrBtcPriceUsd = (payload: unknown): number => {
  const parsed = z
    .object({
      ts: z.number().int().positive(),
      rates: z.object({ usd: positivePriceSchema }),
      error: z.unknown().optional(),
    })
    .safeParse(payload);
  if (!parsed.success || parsed.data.error !== undefined) {
    throw new Error("Invalid Ankr BTC price");
  }
  return parsed.data.rates.usd;
};

export const parseSymbolsParam = (param: string | null): string[] => {
  if (!param) return [];
  return [
    ...new Set(
      param
        .split(",")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
};
