import { describe, expect, it } from "bun:test";
import { parseAnkrRpcResult, usdAmountSchema } from "./ankr-utils";

describe("Ankr RPC envelope", () => {
  it("returns the result, leaving endpoint validation to its parser", () => {
    expect(
      parseAnkrRpcResult({ jsonrpc: "2.0", id: 1, result: { usdPrice: "1" } }),
    ).toEqual({ usdPrice: "1" });
  });

  it("fails on HTTP-200 RPC errors without exposing provider messages or credentials", () => {
    const payload = {
      jsonrpc: "2.0",
      id: 1,
      result: { usdPrice: "1" },
      error: {
        code: -32602,
        message: "https://rpc.ankr.com/multichain/secret",
        data: "secret",
      },
    };
    expect(() => parseAnkrRpcResult(payload)).toThrow(
      "Ankr RPC request failed (-32602)",
    );
    try {
      parseAnkrRpcResult(payload);
    } catch (error) {
      expect(String(error)).not.toContain("secret");
    }
  });

  it.each(
    [
      null,
      [],
      {},
      { id: 1, result: {} },
      { jsonrpc: "2.0", id: 2, result: {} },
      { jsonrpc: "2.0", id: 1 },
      { jsonrpc: "2.0", id: 1, result: null },
    ].map((value) => [value]),
  )("rejects malformed or missing results: %p", (payload) => {
    expect(() => parseAnkrRpcResult(payload)).toThrow();
  });
});

describe("USD number parsing", () => {
  it("accepts finite decimal amounts, including true zero", () => {
    for (const value of [0, "0", "0.00"])
      expect(usdAmountSchema.parse(value)).toBe(0);
    expect(usdAmountSchema.parse("0.0123")).toBe(0.0123);
  });

  it.each(
    [
      null,
      undefined,
      "",
      " ",
      "12garbage",
      "0x12",
      "NaN",
      "Infinity",
      Infinity,
      NaN,
      -1,
      "-1",
      [],
      {},
      false,
      "9".repeat(400),
      `0.${"0".repeat(400)}1`,
    ].map((value) => [value]),
  )(
    "rejects coercion, overflow, underflow, and non-finite data: %p",
    (value) => {
      expect(usdAmountSchema.safeParse(value).success).toBe(false);
    },
  );
});
