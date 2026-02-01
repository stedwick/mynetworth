import { z } from "zod";

const numberLikeSchema = z.preprocess((value) => {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return value;
}, z.number());

const numericStringSchema = z
  .string()
  .refine((value) => Number.isFinite(Number(value)), {
    message: "Expected a numeric string.",
  })
  .transform((value) => Number(value));

export const parseNumberLike = (value: unknown, fallback: number): number => {
  const parsed = numberLikeSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
};

export const toNumber = (value: unknown): number | null => {
  const parsed = numberLikeSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

export const parseNumericString = (value: string): number => {
  return numericStringSchema.parse(value);
};

export const toNumericString = (value: unknown, fallback: string): string => {
  const parsed = toNumber(value);
  return parsed === null ? fallback : String(parsed);
};

export const centsToPriceString = (value: unknown, fallback: string): string => {
  const cents = toNumber(value);
  if (cents === null) return fallback;
  return String(cents / 100);
};
