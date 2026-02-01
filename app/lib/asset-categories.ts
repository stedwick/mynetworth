import { z } from "zod";
import type { Selectable } from "kysely";

import type { DB } from "@/app/lib/db-types";
import { parseNumberLike } from "@/app/lib/number-utils";
import { compareStringsCaseInsensitive } from "@/app/lib/string-utils";
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

    if (isBtcAddress(walletAddress)) {
      return "bitcoin";
    }

    if (isSolAddress(walletAddress)) {
      return "solana";
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
  return parseNumberLike(a, 1) - parseNumberLike(b, 1);
};

const centsToUsd = (value: number | string | bigint | null): number => {
  const cents = parseNumberLike(value, 0);
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
    quantity: parseNumberLike(asset.quantity, 1),
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
    return compareStringsCaseInsensitive(a.name, b.name);
  });

  for (const asset of sortedAssets) {
    const list = assetsByCategory.get(asset.category_id) ?? [];
    list.push(mapAssetItem(asset));
    assetsByCategory.set(asset.category_id, list);
  }

  const sortedCategories = [...categories].sort((a, b) => {
    const sortDiff = compareSort(a.sort_order, b.sort_order);
    if (sortDiff !== 0) return sortDiff;
    return compareStringsCaseInsensitive(a.name, b.name);
  });

  return sortedCategories.map((category) => ({
    id: category.id,
    label: category.name,
    items: assetsByCategory.get(category.id) ?? [],
  }));
};
