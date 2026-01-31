import { z } from "zod";

type MobulaAsset = {
  symbol: string;
  price?: number | null;
};

type MobulaAllAsset = {
  symbol: string;
  name?: string;
  market_cap?: number | null;
};

const mobulaAssetSchema = z.looseObject({
  symbol: z.string(),
  price: z.number().nullable().optional(),
});

const mobulaAllAssetSchema = z.looseObject({
  symbol: z.string(),
  name: z.string().optional(),
  market_cap: z.number().nullable().optional(),
});

const mobulaMultiDataSchema = z.object({
  dataArray: z.array(z.union([mobulaAssetSchema, z.null()])).optional(),
});

export const mobulaAllDataSchema = z.object({
  data: z.array(mobulaAllAssetSchema),
});

export type MobulaMultiData = z.infer<typeof mobulaMultiDataSchema>;
export type MobulaAllData = z.infer<typeof mobulaAllDataSchema>;

export const parseMobulaMultiData = (data: unknown): MobulaMultiData => {
  return mobulaMultiDataSchema.parse(data);
};

export const parseSymbolsParam = (param: string | null): string[] => {
  if (!param) return [];

  const seen = new Set<string>();
  const symbols: string[] = [];

  for (const raw of param.split(",")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const symbol = trimmed.toUpperCase();
    if (seen.has(symbol)) continue;
    seen.add(symbol);
    symbols.push(symbol);
  }

  return symbols;
};

export const mapMobulaAssetsToPrices = (
  assets: Array<MobulaAsset | null | undefined>,
): Record<string, number> => {
  const prices: Record<string, number> = {};

  for (const asset of assets) {
    if (!asset) continue;
    if (typeof asset.price === "number" && Number.isFinite(asset.price)) {
      prices[asset.symbol.toUpperCase()] = asset.price;
    }
  }

  return prices;
};

export type MobulaSymbolMatch = {
  symbol: string;
  name?: string;
  marketCap?: number;
};

export const mapMobulaAllAssetsToSymbols = (
  assets: Array<MobulaAllAsset | null | undefined>,
): MobulaSymbolMatch[] => {
  const symbolsByKey = new Map<string, MobulaSymbolMatch>();

  for (const asset of assets) {
    const rawSymbol = asset?.symbol?.trim();
    if (!rawSymbol) continue;

    const symbol = rawSymbol.toUpperCase();
    const marketCap =
      typeof asset?.market_cap === "number" && Number.isFinite(asset.market_cap)
        ? asset.market_cap
        : undefined;

    const current = symbolsByKey.get(symbol);
    if (
      !current ||
      (typeof marketCap === "number" &&
        (typeof current.marketCap !== "number" ||
          marketCap > current.marketCap))
    ) {
      symbolsByKey.set(symbol, {
        symbol,
        name: asset?.name?.trim() || undefined,
        marketCap,
      });
    }
  }

  return Array.from(symbolsByKey.values());
};
