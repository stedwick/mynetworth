import { describe, expect, it } from "bun:test";

import {
  assetFormValuesFromRecord,
  normalizeAssetFormValues,
  type AssetFormRecord,
} from "./asset-form";

describe("normalizeAssetFormValues", () => {
  it("trims, uppercases, and converts numeric fields", () => {
    const result = normalizeAssetFormValues({
      walletAddress: " 0xabc ",
      name: "  Apple ",
      ticker: " aapl ",
      category: " Retirement ",
      order: "2",
      kind: "wallet",
      price: "185.12",
      quantity: "3.5",
    });

    expect(result.name).toBe("Apple");
    expect(result.tickerSymbol).toBe("AAPL");
    expect(result.categoryInput).toBe("Retirement");
    expect(result.walletAddress).toBe("0xabc");
    expect(result.sortOrder).toBe(2);
    expect(result.quantity).toBe(3.5);
    expect(result.valueCents).toBe(18512);
  });

  it("maps empty wallet address to null", () => {
    const result = normalizeAssetFormValues({
      walletAddress: " ",
      name: "Mortgage",
      ticker: "MORT",
      category: "Debt",
      order: "1",
      kind: "manual",
      price: "-1200",
      quantity: "1",
    });

    expect(result.walletAddress).toBeNull();
    expect(result.valueCents).toBe(-120000);
  });
});

describe("assetFormValuesFromRecord", () => {
  it("maps database values into form defaults", () => {
    const now = new Date("2025-01-02T00:00:00Z");
    const baseRecord: AssetFormRecord = {
      id: "asset-1",
      user_id: "user-1",
      category_id: "category-1",
      name: " Retirement Fund ",
      kind: "crypto",
      ticker_symbol: " eth ",
      quantity: "2.5",
      value_cents: "12345",
      wallet_address: null,
      sort_order: 3,
      category_name: " Crypto ",
      created_at: now,
      updated_at: now,
      price_updated_at: now,
    };

    const result = assetFormValuesFromRecord({
      ...baseRecord,
    });

    expect(result.name).toBe("Retirement Fund");
    expect(result.ticker).toBe("ETH");
    expect(result.category).toBe("Crypto");
    expect(result.quantity).toBe("2.5");
    expect(result.price).toBe("123.45");
    expect(result.order).toBe("3");
    expect(result.kind).toBe("crypto");
    expect(result.walletAddress).toBe("");
  });

  it("falls back when values are missing or invalid", () => {
    const now = new Date("2025-01-02T00:00:00Z");
    const baseRecord: AssetFormRecord = {
      id: "asset-2",
      user_id: "user-2",
      category_id: "category-2",
      name: "",
      kind: "unknown",
      ticker_symbol: "",
      quantity: "not-a-number",
      value_cents: "not-a-number",
      wallet_address: "   ",
      sort_order: Number.NaN,
      category_name: "",
      created_at: now,
      updated_at: now,
      price_updated_at: now,
    };

    const result = assetFormValuesFromRecord({
      ...baseRecord,
    });

    expect(result.kind).toBe("manual");
    expect(result.quantity).toBe("1");
    expect(result.price).toBe("1");
    expect(result.order).toBe("1");
    expect(result.walletAddress).toBe("");
  });
});
