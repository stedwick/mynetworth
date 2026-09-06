import { describe, expect, it, spyOn } from "bun:test";
import {
  DEFAULT_PRICE_FALLBACK,
  getPriceFromMap,
  getPriceLookupResult,
  fetchPriceLookup,
} from "./asset-price";

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

describe("fetchPriceLookup", () => {
  it("ignores an older response even if fetch completes after cancellation", async () => {
    let resolveFirst!: (response: Response) => void;
    const firstResponse = new Promise<Response>((resolve) => {
      resolveFirst = resolve;
    });
    const fetchSpy = spyOn(globalThis, "fetch")
      .mockReturnValueOnce(firstResponse)
      .mockResolvedValueOnce(Response.json({ BTC: 60000 }));
    try {
      const oldRequest = new AbortController();
      const first = fetchPriceLookup("crypto", "ETH", oldRequest.signal);
      oldRequest.abort();
      const latest = await fetchPriceLookup(
        "crypto",
        "BTC",
        new AbortController().signal,
      );
      expect(latest).toEqual({ price: 60000, error: null });
      resolveFirst(Response.json({ ETH: 3000 }));
      expect(await first).toBeNull();
      expect(fetchSpy.mock.calls[0]?.[1]?.signal).toBe(oldRequest.signal);
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("ignores a late JSON result after a manual edit, identity change, or unmount cancels it", async () => {
    let resolveJson!: (prices: Record<string, number>) => void;
    const json = new Promise<Record<string, number>>((resolve) => {
      resolveJson = resolve;
    });
    const response = Response.json({});
    const jsonSpy = spyOn(response, "json").mockImplementation(() => json);
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(response);
    try {
      const request = new AbortController();
      const result = fetchPriceLookup("crypto", "ETH", request.signal);
      await Promise.resolve();
      expect(jsonSpy).toHaveBeenCalledTimes(1);
      request.abort();
      resolveJson({ ETH: 3000 });
      expect(await result).toBeNull();
    } finally {
      fetchSpy.mockRestore();
      jsonSpy.mockRestore();
    }
  });

  it("skips invalid symbols and already aborted requests without fetching", async () => {
    const fetchSpy = spyOn(globalThis, "fetch");
    try {
      const request = new AbortController();
      expect(
        await fetchPriceLookup("crypto", "#SOL", request.signal),
      ).toBeNull();
      expect(await fetchPriceLookup("crypto", "", request.signal)).toBeNull();
      request.abort();
      expect(
        await fetchPriceLookup("crypto", "ETH", request.signal),
      ).toBeNull();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("fetches SOL prices and reports failures without a fake dollar fallback", async () => {
    const fetchSpy = spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ SOL: 150 }))
      .mockResolvedValueOnce(new Response(null, { status: 502 }));
    try {
      const signal = new AbortController().signal;
      expect(await fetchPriceLookup("crypto", " sol ", signal)).toEqual({
        price: 150,
        error: null,
      });
      expect(fetchSpy).toHaveBeenCalledWith("/api/crypto/price?symbols=SOL", {
        cache: "no-store",
        signal,
      });
      const failed = await fetchPriceLookup("crypto", "SOL", signal);
      expect(failed?.price).toBeNull();
      expect(failed?.error).toContain("current price is unchanged");
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("ignores a SOL response that completes after cancellation", async () => {
    const pending = Promise.withResolvers<Response>();
    const fetchSpy = spyOn(globalThis, "fetch").mockReturnValue(
      pending.promise,
    );
    try {
      const request = new AbortController();
      const result = fetchPriceLookup("crypto", "SOL", request.signal);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      request.abort();
      pending.resolve(Response.json({ SOL: 150 }));
      expect(await result).toBeNull();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("does not surface an aborted request as an error or stock fallback", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockRejectedValue(
      new DOMException("Aborted", "AbortError"),
    );
    try {
      for (const kind of ["crypto", "stock"]) {
        const request = new AbortController();
        const result = fetchPriceLookup(kind, "ETH", request.signal);
        request.abort();
        expect(await result).toBeNull();
      }
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("returns crypto failure feedback without a price and retains stock fallback", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 503 }),
    );
    try {
      const signal = new AbortController().signal;
      const crypto = await fetchPriceLookup("crypto", "ETH", signal);
      expect(crypto?.price).toBeNull();
      expect(crypto?.error).toContain("current price is unchanged");
      expect(await fetchPriceLookup("stock", "AAPL", signal)).toEqual({
        price: DEFAULT_PRICE_FALLBACK,
        error: null,
      });
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe("getPriceLookupResult", () => {
  it("returns supported crypto prices without manufacturing a fallback", () => {
    expect(getPriceLookupResult("crypto", " btc ", { BTC: 60000 })).toEqual({
      price: 60000,
      error: null,
    });
    expect(getPriceLookupResult("crypto", "ETH", { ETH: 0 })).toEqual({
      price: 0,
      error: null,
    });
    const missingOrInvalid: (Record<string, number> | null)[] = [
      null,
      {},
      { BTC: NaN },
      { BTC: Infinity },
      { BTC: -1 },
    ];
    for (const prices of missingOrInvalid) {
      const result = getPriceLookupResult("crypto", "BTC", prices);
      expect(result.price).toBeNull();
      expect(result.error).toContain("current price is unchanged");
    }
  });

  it.each(["SOL", "ZEC", "TRX", "FIL", "S", "MON", "UNKNOWN"])(
    "accepts valid %s prices and reports missing quotes",
    (symbol) => {
      expect(getPriceLookupResult("crypto", symbol, { [symbol]: 150 })).toEqual(
        { price: 150, error: null },
      );
      for (const prices of [null, {}, { [symbol]: NaN }, { [symbol]: -1 }]) {
        const result = getPriceLookupResult("crypto", symbol, prices);
        expect(result.price).toBeNull();
        expect(result.error).toContain("current price is unchanged");
      }
    },
  );

  it("silently leaves invalid crypto unchanged even if a price is returned", () => {
    for (const symbol of ["#SOL", "NOT_SUPPORTED", ""]) {
      expect(getPriceLookupResult("crypto", symbol, { [symbol]: 1 })).toEqual({
        price: null,
        error: null,
      });
      expect(getPriceLookupResult("crypto", symbol, null)).toEqual({
        price: null,
        error: null,
      });
    }
  });

  it("retains the existing stock fallback behavior", () => {
    expect(getPriceLookupResult("stock", "AAPL", null)).toEqual({
      price: DEFAULT_PRICE_FALLBACK,
      error: null,
    });
    expect(getPriceLookupResult("stock", "AAPL", { AAPL: 210 })).toEqual({
      price: 210,
      error: null,
    });
  });
});
