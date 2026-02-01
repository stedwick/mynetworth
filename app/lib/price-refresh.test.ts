import { describe, expect, it } from "bun:test";
import {
  chunkList,
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

    expect(result).toEqual([
      "0x396343362be2A4dA1cE0C1C210945346fb82Aa49",
      "So11111111111111111111111111111111111111112",
    ]);
  });
});

describe("chunkList", () => {
  it("splits items into size-limited batches", () => {
    const result = chunkList([1, 2, 3, 4, 5], 2);

    expect(result).toEqual([[1, 2], [3, 4], [5]]);
  });
});
