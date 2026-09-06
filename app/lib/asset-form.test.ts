import { describe, expect, it } from "bun:test";

import {
  assetFormValuesFromRecord,
  assetFormSchema,
  assetEditDefaultValues,
  getWalletAddressError,
  getPriceForIdentityChange,
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
      kind: "stock",
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

  it("normalizes supported wallet quantities without changing address casing", () => {
    for (const walletAddress of [
      "1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4",
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080",
      "0x396343362be2A4dA1cE0C1C210945346fb82Aa49",
      "So11111111111111111111111111111111111111112",
    ]) {
      const result = normalizeAssetFormValues({
        ...assetEditDefaultValues,
        kind: "wallet",
        name: "Wallet",
        ticker: "WALLET",
        category: "Crypto",
        walletAddress: ` ${walletAddress} `,
        quantity: "12.5",
      });
      expect(result.quantity).toBe(1);
      expect(result.walletAddress).toBe(walletAddress);
    }
  });

  it("normalizes Solana quantity to one while retaining the submitted USD total", () => {
    const result = normalizeAssetFormValues({
      ...assetEditDefaultValues,
      kind: "wallet",
      name: "Renamed wallet",
      ticker: "SOL",
      category: "Crypto",
      walletAddress: "So11111111111111111111111111111111111111112",
      quantity: "3.5",
      price: "123.45",
    });
    expect(result.quantity).toBe(1);
    expect(result.valueCents).toBe(12345);
  });

  it.each(["", "0xabc", "not-an-address", "0".repeat(44), "S".repeat(45)])(
    "rejects malformed wallet address %s in the shared schema",
    (walletAddress) => {
      const result = assetFormSchema.safeParse({
        ...assetEditDefaultValues,
        kind: "wallet",
        name: "Wallet",
        ticker: "WALLET",
        category: "Crypto",
        walletAddress,
      });
      expect(result.success).toBe(false);
      expect(getWalletAddressError("wallet", walletAddress)).not.toBeNull();
    },
  );
});

describe("getPriceForIdentityChange", () => {
  it("clears the default price on entering crypto and requires a quote or manual price", () => {
    for (const ticker of ["ETH", "SOL"]) {
      const next = { kind: "crypto" as const, ticker };
      const price = getPriceForIdentityChange(assetEditDefaultValues, next);
      expect(price).toBe("");
      const values = {
        ...assetEditDefaultValues,
        ...next,
        name: "Crypto",
        category: "Crypto",
        price,
      };
      expect(assetFormSchema.safeParse(values).success).toBe(false);
      expect(assetFormSchema.safeParse({ ...values, price: " " }).success).toBe(
        false,
      );
      expect(
        assetFormSchema.safeParse({ ...values, price: "123.45" }).success,
      ).toBe(true);
      expect(assetFormSchema.safeParse({ ...values, price: "1" }).success).toBe(
        true,
      );
    }
  });

  it("clears a previous token price on typed or selected identity changes", () => {
    const current = { kind: "crypto" as const, ticker: "ETH" };
    for (const ticker of ["SOL", "BTC", "E", ""]) {
      expect(getPriceForIdentityChange(current, { ...current, ticker })).toBe(
        "",
      );
    }
  });

  it("preserves loaded crypto prices and same-symbol selections", () => {
    for (const ticker of ["ETH", "SOL"]) {
      const current = { kind: "crypto" as const, ticker };
      expect(getPriceForIdentityChange(current, current)).toBeNull();
      expect(
        getPriceForIdentityChange(current, {
          ...current,
          ticker: ` ${ticker.toLowerCase()} `,
        }),
      ).toBeNull();
    }
  });

  it("gives newly selected wallets a valid hidden zero price", () => {
    const next = { kind: "wallet" as const, ticker: "WALLET" };
    const price = getPriceForIdentityChange(
      { kind: "crypto", ticker: "ETH" },
      next,
    );
    expect(price).toBe("0");
    expect(
      assetFormSchema.safeParse({
        ...assetEditDefaultValues,
        ...next,
        name: "Wallet",
        category: "Crypto",
        walletAddress: "0x396343362be2A4dA1cE0C1C210945346fb82Aa49",
        price,
      }).success,
    ).toBe(true);
    expect(getPriceForIdentityChange(next, next)).toBeNull();
  });

  it("does not reset stock prices on ticker changes", () => {
    expect(
      getPriceForIdentityChange(
        { kind: "stock", ticker: "AAPL" },
        { kind: "stock", ticker: "TSLA" },
      ),
    ).toBeNull();
  });
});

describe("getWalletAddressError", () => {
  const sol = "So11111111111111111111111111111111111111112";

  it("allows new Bitcoin and EVM wallets, including Bitcoin matching Solana Base58", () => {
    expect(
      getWalletAddressError("wallet", "1PuJjnF476W3zXfVYmJfGnouzFDAXakkL4"),
    ).toBeNull();
    expect(
      getWalletAddressError(
        "wallet",
        "0x396343362be2A4dA1cE0C1C210945346fb82Aa49",
      ),
    ).toBeNull();
  });

  it("allows new and changed Solana wallet addresses", () => {
    expect(getWalletAddressError("wallet", sol)).toBeNull();
    expect(getWalletAddressError("wallet", ` ${sol} `)).toBeNull();
    expect(
      getWalletAddressError(
        "wallet",
        "So11111111111111111111111111111111111111113",
      ),
    ).toBeNull();
  });

  it("does not restrict non-wallet assets or accept missing wallet addresses", () => {
    expect(getWalletAddressError("crypto", null)).toBeNull();
    expect(getWalletAddressError("wallet", null)).not.toBeNull();
    expect(getWalletAddressError("wallet", "not-an-address")).not.toBeNull();
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
