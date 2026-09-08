import { describe, expect, it } from "bun:test";
import { computeNetWorthSummary } from "./networth";

import {
  buildAssetCategories,
  type AssetRow,
  type CategoryRow,
} from "./asset-categories";

const now = new Date("2025-01-02T00:00:00Z");

const categories: CategoryRow[] = [
  {
    id: "c2",
    name: "Retirement",
    sort_order: 2,
    created_at: now,
    updated_at: now,
    user_id: "user-1",
  },
  {
    id: "c1",
    name: "Cash",
    sort_order: 1,
    created_at: now,
    updated_at: now,
    user_id: "user-1",
  },
  {
    id: "c3",
    name: "Empty",
    sort_order: 3,
    created_at: now,
    updated_at: now,
    user_id: "user-1",
  },
];

const assets: AssetRow[] = [
  {
    id: "a1",
    hyperliquid_enabled: false,
    hyperliquid_balance_cents: null,
    category_id: "c1",
    name: "Wallet Asset",
    kind: "wallet",
    ticker_symbol: "eth",
    quantity: "2",
    value_cents: "1234",
    wallet_address: "0x396343362be2A4dA1cE0C1C210945346fb82Aa49",
    sort_order: 2,
    created_at: now,
    updated_at: now,
    price_updated_at: now,
    user_id: "user-1",
  },
  {
    id: "a2",
    hyperliquid_enabled: false,
    hyperliquid_balance_cents: null,
    category_id: "c1",
    name: "Manual Asset",
    kind: "manual",
    ticker_symbol: "usd",
    quantity: "1",
    value_cents: "10000",
    wallet_address: null,
    sort_order: 1,
    created_at: now,
    updated_at: now,
    price_updated_at: now,
    user_id: "user-1",
  },
  {
    id: "a3",
    hyperliquid_enabled: false,
    hyperliquid_balance_cents: null,
    category_id: "c2",
    name: "Unknown Kind",
    kind: "mystery",
    ticker_symbol: "btc",
    quantity: "0.5",
    value_cents: "999",
    wallet_address: null,
    sort_order: 1,
    created_at: now,
    updated_at: now,
    price_updated_at: now,
    user_id: "user-1",
  },
  {
    id: "a4",
    hyperliquid_enabled: false,
    hyperliquid_balance_cents: null,
    category_id: "c2",
    name: "BTC Wallet",
    kind: "wallet",
    ticker_symbol: "btc",
    quantity: "1",
    value_cents: "500",
    wallet_address: "1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4",
    sort_order: 2,
    created_at: now,
    updated_at: now,
    price_updated_at: now,
    user_id: "user-1",
  },
];

describe("buildAssetCategories", () => {
  it("carries secondary balances without changing any totals", () => {
    const baseline = computeNetWorthSummary(
      buildAssetCategories(categories, assets),
    );
    for (const balance of [null, "0", "12345678", "-1234"]) {
      const result = buildAssetCategories(
        categories,
        assets.map((asset) => ({
          ...asset,
          hyperliquid_enabled: asset.id === "a1",
          hyperliquid_balance_cents: asset.id === "a1" ? balance : null,
        })),
      );
      expect(result[0].items[1]).toMatchObject({
        hyperliquidEnabled: true,
        hyperliquidBalanceCents: balance,
      });
      expect(computeNetWorthSummary(result)).toEqual(baseline);
    }
  });
  it("groups, sorts, and normalizes assets", () => {
    const result = buildAssetCategories(categories, assets);

    expect(result.map((category) => category.id)).toEqual(["c1", "c2", "c3"]);
    expect(result[0].items.map((item) => item.id)).toEqual(["a2", "a1"]);

    const walletItem = result[0].items[1];
    if (walletItem.kind !== "wallet") {
      throw new Error("Expected wallet item");
    }
    expect(walletItem.walletNetwork).toBe("evm");
    expect(walletItem.price).toBeCloseTo(12.34);
    expect(walletItem.quantity).toBe(2);

    const normalizedItem = result[1].items[0];
    expect(normalizedItem.kind).toBe("manual");

    const btcWalletItem = result[1].items[1];
    if (btcWalletItem.kind !== "wallet") {
      throw new Error("Expected wallet item");
    }
    expect(btcWalletItem.walletNetwork).toBe("bitcoin");

    expect(result[2].items).toEqual([]);
  });
});
