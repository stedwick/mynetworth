import { z } from "zod";

import type { AssetKind } from "@/app/lib/networth";

export const assetKindSchema = z.enum(["stock", "crypto", "wallet", "manual"]);

const requiredString = (message: string) =>
  z.string().trim().min(1, { message });

const numericString = (message: string) =>
  requiredString(message).refine((value) => Number.isFinite(Number(value)), {
    message,
  });

export const assetFormSchema = z
  .object({
    walletAddress: z.string().trim(),
    name: requiredString("Asset name is required."),
    ticker: requiredString("Ticker symbol is required."),
    category: requiredString("Category is required."),
    order: numericString("Order must be a number."),
    kind: assetKindSchema,
    price: numericString("Price must be a number."),
    quantity: numericString("Quantity must be a number."),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "wallet" && data.walletAddress.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Wallet address is required.",
        path: ["walletAddress"],
      });
    }
  });

export type AssetEditFormValues = z.infer<typeof assetFormSchema>;

export type NormalizedAssetFormValues = {
  name: string;
  tickerSymbol: string;
  categoryInput: string;
  kind: AssetKind;
  walletAddress: string | null;
  quantity: number;
  valueCents: number;
  sortOrder: number;
};

const parseNumber = (value: string): number => {
  return Number(value);
};

const parseCurrencyToCents = (value: string): number => {
  return Math.round(parseNumber(value) * 100);
};

export const normalizeAssetFormValues = (
  values: AssetEditFormValues,
): NormalizedAssetFormValues => {
  const parsed = assetFormSchema.parse(values);
  const name = parsed.name.trim();
  const tickerSymbol = parsed.ticker.trim().toUpperCase();
  const categoryInput = parsed.category.trim();
  const walletAddress = parsed.walletAddress.trim();

  return {
    name,
    tickerSymbol,
    categoryInput,
    kind: parsed.kind,
    walletAddress: walletAddress.length > 0 ? walletAddress : null,
    quantity: parseNumber(parsed.quantity),
    valueCents: parseCurrencyToCents(parsed.price),
    sortOrder: parseNumber(parsed.order),
  };
};

export const assetEditDefaultValues: AssetEditFormValues = {
  walletAddress: "",
  name: "",
  ticker: "",
  category: "",
  order: "1",
  kind: "stock",
  price: "1",
  quantity: "1",
};
