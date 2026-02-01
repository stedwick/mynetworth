import { z } from "zod";
import type { Selectable } from "kysely";

import type { DB } from "@/app/lib/db-types";
import {
  isBtcAddress,
  isEthAddress,
  isSolAddress,
} from "@/app/api/crypto/wallet/utils";
import type {
  AssetCategory,
  AssetItem,
  AssetKind,
  WalletNetwork,
} from "./networth";

export type CategoryRow = Selectable<DB["categories"]>;

export type AssetRow = Selectable<DB["assets"]>;

const numberLikeSchema = z.preprocess((value) => {
  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return value;
}, z.number());

const parseNumber = (value: unknown, fallback: number): number => {
  const parsed = numberLikeSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
};

const assetKindSchema = z.enum(["stock", "crypto", "wallet", "manual"]);

const normalizeAssetKind = (value: string | null): AssetKind => {
  const parsed = assetKindSchema.safeParse(value);
  return parsed.success ? parsed.data : "manual";
};

const inferWalletNetwork = (
  walletAddress: string | null,
  ticker: string,
): WalletNetwork => {
  if (walletAddress) {
    if (isEthAddress(walletAddress)) {
      return "evm";
    }

    if (isSolAddress(walletAddress)) {
      return "solana";
    }

    if (isBtcAddress(walletAddress)) {
      return "bitcoin";
    }
  }

  const normalizedTicker = ticker.toUpperCase();

  if (normalizedTicker === "BTC") {
    return "bitcoin";
  }

  if (normalizedTicker === "SOL") {
    return "solana";
  }

  return "evm";
};

const compareSort = (a: number | string | null, b: number | string | null) => {
  return parseNumber(a, 1) - parseNumber(b, 1);
};

const compareByName = (a: string, b: string) =>
  a.localeCompare(b, "en", { sensitivity: "base" });

const centsToUsd = (value: number | string | bigint | null): number => {
  const cents = parseNumber(value, 0);
  return cents / 100;
};

const mapAssetItem = (asset: AssetRow): AssetItem => {
  const kind = normalizeAssetKind(asset.kind);
  const ticker = asset.ticker_symbol.trim().toUpperCase();
  const baseItem = {
    id: asset.id,
    ticker,
    name: asset.name,
    price: centsToUsd(asset.value_cents),
    quantity: parseNumber(asset.quantity, 1),
  };

  if (kind === "wallet") {
    return {
      ...baseItem,
      kind,
      walletNetwork: inferWalletNetwork(asset.wallet_address, ticker),
    };
  }

  return { ...baseItem, kind };
};

export const buildAssetCategories = (
  categories: CategoryRow[],
  assets: AssetRow[],
): AssetCategory[] => {
  const assetsByCategory = new Map<string, AssetItem[]>();
  const sortedAssets = [...assets].sort((a, b) => {
    const sortDiff = compareSort(a.sort_order, b.sort_order);
    if (sortDiff !== 0) return sortDiff;
    return compareByName(a.name, b.name);
  });

  for (const asset of sortedAssets) {
    const list = assetsByCategory.get(asset.category_id) ?? [];
    list.push(mapAssetItem(asset));
    assetsByCategory.set(asset.category_id, list);
  }

  const sortedCategories = [...categories].sort((a, b) => {
    const sortDiff = compareSort(a.sort_order, b.sort_order);
    if (sortDiff !== 0) return sortDiff;
    return compareByName(a.name, b.name);
  });

  return sortedCategories.map((category) => ({
    id: category.id,
    label: category.name,
    items: assetsByCategory.get(category.id) ?? [],
  }));
};
