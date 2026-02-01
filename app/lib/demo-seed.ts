import type { AssetCategory } from "@/app/lib/networth";

export type DemoSeedCategory = {
  name: string;
  sortOrder: number;
};

export type DemoSeedAsset = {
  categoryName: string;
  name: string;
  tickerSymbol: string;
  kind: string;
  walletAddress: string | null;
  quantity: number;
  valueCents: number;
  sortOrder: number;
};

export type DemoSeedData = {
  categories: DemoSeedCategory[];
  assets: DemoSeedAsset[];
};

const priceToCents = (value: number): number => Math.round(value * 100);

export const buildDemoSeedData = (
  categories: AssetCategory[],
): DemoSeedData => {
  const seedCategories = categories.map((category, index) => ({
    name: category.label.trim(),
    sortOrder: index + 1,
  }));

  const seedAssets = categories.flatMap((category) => {
    const categoryName = category.label.trim();

    return category.items.map((item, index) => ({
      categoryName,
      name: item.name.trim(),
      tickerSymbol: item.ticker.trim().toUpperCase(),
      kind: item.kind,
      walletAddress: null,
      quantity: item.quantity,
      valueCents: priceToCents(item.price),
      sortOrder: index + 1,
    }));
  });

  return { categories: seedCategories, assets: seedAssets };
};
