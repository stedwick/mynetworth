"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isSupportedCryptoSymbol } from "@/app/lib/crypto-assets";

export const DEFAULT_PRICE_FALLBACK = 1;

export const getPriceFromMap = (
  prices: Record<string, number>,
  symbol: string,
  fallback = DEFAULT_PRICE_FALLBACK,
): number => {
  const key = symbol.trim().toUpperCase();
  if (!key) return fallback;

  const price = prices[key];
  if (typeof price !== "number" || !Number.isFinite(price)) {
    return fallback;
  }

  return price;
};

export const getPriceLookupResult = (
  kind: string,
  symbol: string,
  prices: Record<string, number> | null,
): { price: number | null; error: string | null } => {
  if (kind !== "crypto") {
    return { price: getPriceFromMap(prices ?? {}, symbol), error: null };
  }
  const key = symbol.trim().toUpperCase();
  if (!isSupportedCryptoSymbol(key)) return { price: null, error: null };
  const price = prices?.[key];
  if (typeof price === "number" && Number.isFinite(price) && price >= 0) {
    return { price, error: null };
  }
  return {
    price: null,
    error: `Could not fetch a price for ${key}. Your current price is unchanged; try again or enter a price manually.`,
  };
};

const getPriceEndpoint = (kind: string | null | undefined): string | null => {
  if (kind === "stock") return "/api/stocks/price";
  if (kind === "crypto") return "/api/crypto/price";
  return null;
};

export const fetchPriceLookup = async (
  kind: string | null | undefined,
  symbol: string,
  signal: AbortSignal,
): Promise<ReturnType<typeof getPriceLookupResult> | null> => {
  const endpoint = getPriceEndpoint(kind);
  const normalizedSymbol = symbol.trim().toUpperCase();
  if (
    signal.aborted ||
    !endpoint ||
    !normalizedSymbol ||
    (kind === "crypto" && !isSupportedCryptoSymbol(normalizedSymbol))
  ) {
    return null;
  }

  let prices: Record<string, number> | null = null;
  try {
    const response = await fetch(
      `${endpoint}?symbols=${encodeURIComponent(normalizedSymbol)}`,
      { cache: "no-store", signal },
    );
    if (!response.ok) throw new Error("Price request failed");
    prices = (await response.json()) as Record<string, number>;
  } catch (_error) {
    // Crypto failures retain the current field; stocks keep their fallback.
  }
  // Check even when fetch/JSON parsing completes despite cancellation.
  if (signal.aborted) return null;
  return getPriceLookupResult(kind ?? "", normalizedSymbol, prices);
};

export const usePriceLookup = ({
  kind,
  onPriceResolved,
}: {
  kind: string | null | undefined;
  onPriceResolved: (price: number) => void;
}): {
  lookupPrice: (symbol: string) => Promise<void>;
  cancelLookup: () => void;
  loading: boolean;
  error: { symbol: string; message: string } | null;
} => {
  const request = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{
    symbol: string;
    message: string;
  } | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  const cancelLookup = useCallback(() => {
    request.current?.abort();
    request.current = null;
    setLoading(false);
    setError(null);
  }, []);

  const lookupPrice = useCallback(
    async (symbol: string) => {
      cancelLookup();
      const controller = new AbortController();
      request.current = controller;
      const normalizedSymbol = symbol.trim().toUpperCase();
      setLoading(true);
      const result = await fetchPriceLookup(
        kind,
        normalizedSymbol,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      setLoading(false);
      if (!result) return;
      if (result.price !== null) onPriceResolved(result.price);
      if (result.error) {
        setError({ symbol: normalizedSymbol, message: result.error });
      }
    },
    [cancelLookup, kind, onPriceResolved],
  );

  return { lookupPrice, cancelLookup, loading, error };
};
