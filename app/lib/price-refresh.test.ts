import { describe, expect, it } from "bun:test";
import {
  chunkList,
  collectRefreshPrices,
  normalizeSymbols,
  normalizeWalletAddresses,
} from "./price-refresh";

describe("normalizeSymbols", () => {
  it("trims, uppercases, dedupes, and sorts symbols", () => {
    const result = normalizeSymbols([" aapl ", "MSFT", "AAPL", " ", "amzn"]);

    expect(result).toEqual(["AAPL", "AMZN", "MSFT"]);
  });
});

describe("normalizeWalletAddresses", () => {
  it("filters invalid addresses, trims, dedupes, and sorts", () => {
    const result = normalizeWalletAddresses([
      " 0x396343362be2A4dA1cE0C1C210945346fb82Aa49 ",
      "So11111111111111111111111111111111111111112",
      "not-an-address",
      "0x396343362be2A4dA1cE0C1C210945346fb82Aa49",
    ]);

    expect(result).toEqual(["0x396343362be2a4da1ce0c1c210945346fb82aa49"]);
  });
});

describe("collectRefreshPrices", () => {
  it("deduplicates 100 targets and limits concurrency to four", async () => {
    let active = 0;
    let peak = 0;
    let calls = 0;
    const keys = Array.from({ length: 100 }, (_, index) => String(index));
    const result = await collectRefreshPrices(
      [...keys, ...keys],
      async (key) => {
        active++;
        peak = Math.max(active, peak);
        calls++;
        await Bun.sleep(1);
        active--;
        return Number(key);
      },
    );
    expect(calls).toBe(100);
    expect(peak).toBe(4);
    expect(Object.keys(result.prices)).toHaveLength(100);
    expect(result.failed).toEqual([]);
  });
  it("keeps successful zero values and reports failures without fabricating prices", async () => {
    const result = await collectRefreshPrices(
      ["zero", "error", "nan", "negative", "overflow", "good"],
      async (key) => {
        if (key === "error") throw new Error("Provider failure");
        return {
          zero: 0,
          nan: NaN,
          negative: -1,
          overflow: Number.MAX_VALUE,
          good: 42,
        }[key]!;
      },
    );
    expect(result.prices).toEqual({ zero: 0, good: 42 });
    expect(result.failed).toEqual(["error", "nan", "negative", "overflow"]);
  });
});

describe("chunkList", () => {
  it("splits items into size-limited batches", () => {
    const result = chunkList([1, 2, 3, 4, 5], 2);

    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });
});
