"use client";

import { useCallback, useState } from "react";

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

const getPriceEndpoint = (kind: string | null | undefined): string | null => {
  if (kind === "stock") return "/api/stocks/price";
  if (kind === "crypto") return "/api/crypto/price";
  return null;
};

export const usePriceLookup = ({
  kind,
  onPriceResolved,
}: {
  kind: string | null | undefined;
  onPriceResolved: (price: number) => void;
}): { lookupPrice: (symbol: string) => Promise<void>; loading: boolean } => {
  const endpoint = getPriceEndpoint(kind);
  const [pending, setPending] = useState(0);

  const lookupPrice = useCallback(
    async (symbol: string) => {
      if (!endpoint) return;
      const normalizedSymbol = symbol.trim().toUpperCase();
      if (!normalizedSymbol) return;

      setPending((current) => current + 1);
      try {
        const response = await fetch(
          `${endpoint}?symbols=${encodeURIComponent(normalizedSymbol)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          throw new Error("Price request failed");
        }

        const data = (await response.json()) as Record<string, number>;
        onPriceResolved(getPriceFromMap(data, normalizedSymbol));
      } catch (_error) {
        onPriceResolved(DEFAULT_PRICE_FALLBACK);
      } finally {
        setPending((current) => Math.max(current - 1, 0));
      }
    },
    [endpoint, onPriceResolved],
  );

  return { lookupPrice, loading: pending > 0 };
};
