export const parseSearchQueryParam = (param: string | null): string | null => {
  if (!param) return null;
  const trimmed = param.trim();
  if (trimmed.length < 2) return null;
  return trimmed;
};

export type MobulaSearchMatch = {
  symbol: string;
  name?: string;
  marketCap?: number;
};

export const filterMobulaSymbols = (
  symbols: MobulaSearchMatch[],
  query: string,
  limit = 20,
): MobulaSearchMatch[] => {
  if (limit <= 0) return [];
  const normalizedQuery = query.trim().toUpperCase();
  if (!normalizedQuery) return [];

  const matches: MobulaSearchMatch[] = [];

  for (const symbol of symbols) {
    if (matches.length >= limit) break;
    const matchesSymbol = symbol.symbol.toUpperCase().includes(normalizedQuery);
    const matchesName = symbol.name
      ? symbol.name.toUpperCase().includes(normalizedQuery)
      : false;
    if (matchesSymbol || matchesName) {
      matches.push(symbol);
    }
  }

  return matches;
};

export const sortMobulaMatchesByMarketCap = (
  matches: MobulaSearchMatch[],
): MobulaSearchMatch[] => {
  return [...matches].sort((a, b) => {
    const aCap = typeof a.marketCap === "number" ? a.marketCap : -1;
    const bCap = typeof b.marketCap === "number" ? b.marketCap : -1;

    if (aCap !== bCap) return bCap - aCap;
    return a.symbol.localeCompare(b.symbol);
  });
};

export const orderMobulaMatches = (
  matches: MobulaSearchMatch[],
  query: string,
): MobulaSearchMatch[] => {
  const normalizedQuery = query.trim().toUpperCase();
  const exactMatchIndex = matches.findIndex(
    (match) => match.symbol.toUpperCase() === normalizedQuery,
  );
  const exactMatch =
    exactMatchIndex >= 0 ? matches[exactMatchIndex] : undefined;
  const remaining = matches.filter((_, index) => index !== exactMatchIndex);
  const sorted = sortMobulaMatchesByMarketCap(remaining);

  if (!exactMatch) {
    return sorted;
  }

  return [exactMatch, ...sorted];
};
