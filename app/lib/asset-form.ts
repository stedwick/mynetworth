import { z } from "zod";
import type { Selectable } from "kysely";

import type { AssetKind } from "@/app/lib/networth";
import type { DB } from "@/app/lib/db-types";
import {
  isBtcAddress,
  isEthAddress,
  isSolAddress,
} from "@/app/api/crypto/wallet/utils";
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
    if (
      data.kind === "wallet" &&
      !isBtcAddress(data.walletAddress) &&
      !isEthAddress(data.walletAddress) &&
      !isSolAddress(data.walletAddress)
    ) {
      ctx.addIssue({
        code: "custom",
        message: data.walletAddress
          ? "Enter a Bitcoin or EVM wallet address."
          : "Wallet address is required.",
        path: ["walletAddress"],
      });
    }
  });

export type AssetEditFormValues = z.infer<typeof assetFormSchema>;

export const getPriceForIdentityChange = (
  current: Pick<AssetEditFormValues, "kind" | "ticker">,
  next: Pick<AssetEditFormValues, "kind" | "ticker">,
): string | null => {
  if (
    current.kind === next.kind &&
    current.ticker.trim().toUpperCase() === next.ticker.trim().toUpperCase()
  ) {
    return null;
  }
  if (next.kind === "crypto") return "";
  if (next.kind === "wallet" && current.kind !== "wallet") return "0";
  return null;
};

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

export const getWalletAddressError = (
  kind: string,
  walletAddress: string | null,
  existing?: { kind: string; wallet_address: string | null },
): string | null => {
  if (kind !== "wallet") return null;
  const address = walletAddress?.trim() ?? "";
  if (!address) return "Wallet address is required.";
  // Bitcoin Base58 addresses can also match the legacy Solana format.
  if (isBtcAddress(address) || isEthAddress(address)) return null;
  if (
    isSolAddress(address) &&
    existing?.kind === "wallet" &&
    existing.wallet_address?.trim() === address
  ) {
    return null;
  }
  return "Enter a Bitcoin or EVM wallet address. Existing Solana wallets can only keep their current address.";
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
    quantity:
      parsed.kind === "wallet" &&
      (isBtcAddress(walletAddress) || isEthAddress(walletAddress))
        ? 1
        : parseNumericString(parsed.quantity),
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
