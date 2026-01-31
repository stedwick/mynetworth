import { z } from "zod";

type MobulaAsset = {
  symbol: string;
  price?: number | null;
};

const mobulaAssetSchema = z.looseObject({
  symbol: z.string(),
  price: z.number().nullable().optional(),
});

const mobulaMultiDataSchema = z.object({
  dataArray: z.array(z.union([mobulaAssetSchema, z.null()])).optional(),
});

export type MobulaMultiData = z.infer<typeof mobulaMultiDataSchema>;

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
