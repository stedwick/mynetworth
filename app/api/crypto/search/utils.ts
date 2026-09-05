import { cryptoAssets } from "@/app/lib/crypto-assets";

export const parseSearchQueryParam = (param: string | null): string | null => {
  if (!param) return null;
  const trimmed = param.trim();
  return trimmed.length < 2 ? null : trimmed;
};

export const searchCryptoAssets = (
  query: string,
  limit = 20,
): { symbol: string; name?: string }[] => {
  const normalized = query.trim().toUpperCase();
  if (!normalized || limit <= 0) return [];
  return cryptoAssets
    .filter(
      (asset) =>
        asset.symbol.includes(normalized) ||
        asset.name.toUpperCase().includes(normalized),
    )
    .sort(
      (a, b) =>
        Number(b.symbol === normalized) - Number(a.symbol === normalized),
    )
    .slice(0, limit)
    .map(({ symbol, name }) => ({ symbol, name }));
};
