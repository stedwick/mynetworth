import { describe, expect, it } from "bun:test";

import { normalizeAssetFormValues } from "./asset-form";

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
