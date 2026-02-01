import { z } from "zod";
import type { Selectable } from "kysely";

import type { AssetKind } from "@/app/lib/networth";
import type { DB } from "@/app/lib/db-types";
import {
  centsToPriceString,
  parseNumericString,
  toNumericString,
} from "@/app/lib/number-utils";

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

export type AssetFormRecord = Selectable<DB["assets"]> & {
  category_name: string;
};

const parseCurrencyToCents = (value: string): number => {
  return Math.round(parseNumericString(value) * 100);
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
    quantity: parseNumericString(parsed.quantity),
    valueCents: parseCurrencyToCents(parsed.price),
    sortOrder: parseNumericString(parsed.order),
  };
};

export const assetFormValuesFromRecord = (
  record: AssetFormRecord,
): AssetEditFormValues => {
  const kindResult = assetKindSchema.safeParse(record.kind);
  const kind = kindResult.success ? kindResult.data : "manual";

  return {
    walletAddress: record.wallet_address?.trim() ?? "",
    name: record.name?.trim() ?? "",
    ticker: record.ticker_symbol?.trim().toUpperCase() ?? "",
    category: record.category_name?.trim() ?? "",
    order: toNumericString(record.sort_order, "1"),
    kind,
    price: centsToPriceString(record.value_cents, "1"),
    quantity: toNumericString(record.quantity, "1"),
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
