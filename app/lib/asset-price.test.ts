import { describe, expect, it } from "bun:test";
import { DEFAULT_PRICE_FALLBACK, getPriceFromMap } from "./asset-price";

describe("getPriceFromMap", () => {
  it("returns the symbol price when available", () => {
    const result = getPriceFromMap({ TSLA: 250.5 }, "tsla");
    expect(result).toBe(250.5);
  });

  it("falls back when the price is missing or invalid", () => {
    expect(getPriceFromMap({}, "TSLA")).toBe(DEFAULT_PRICE_FALLBACK);
    expect(getPriceFromMap({ TSLA: NaN }, "TSLA")).toBe(DEFAULT_PRICE_FALLBACK);
    expect(getPriceFromMap({ TSLA: Infinity }, "TSLA")).toBe(
      DEFAULT_PRICE_FALLBACK,
    );
  });
});
