import { describe, expect, it } from "bun:test";

import { getInitialPriceUpdatedAt } from "./asset-price-updated-at";

describe("getInitialPriceUpdatedAt", () => {
  it("returns the fixed wallet date for wallet assets", () => {
    const result = getInitialPriceUpdatedAt("wallet", new Date("2026-01-01"));

    expect(result.toISOString()).toBe("2025-01-01T00:00:00.000Z");
  });

  it("returns the reference date for non-wallet assets", () => {
    const reference = new Date("2025-06-01T12:34:56Z");
    const result = getInitialPriceUpdatedAt("stock", reference);

    expect(result.toISOString()).toBe(reference.toISOString());
  });
});
