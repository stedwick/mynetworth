export type AssetKind = "stock" | "crypto" | "wallet" | "manual";

export type WalletNetwork = "bitcoin" | "evm" | "solana";

type BaseAssetItem = {
  ticker: string;
  name: string;
  price: number;
  quantity: number;
};

export type AssetItem =
  | (BaseAssetItem & { kind: "stock" | "crypto" | "manual" })
  | (BaseAssetItem & { kind: "wallet"; walletNetwork: WalletNetwork });

export type AssetCategory = {
  id: string;
  label: string;
  items: AssetItem[];
};

export type NetWorthSummary = {
  categoryTotals: Record<string, number>;
  netWorth: number;
};

export function getAssetTotal(item: AssetItem) {
  return item.price * item.quantity;
}

export function computeNetWorthSummary(
  categories: AssetCategory[],
): NetWorthSummary {
  const categoryTotals = categories.reduce<Record<string, number>>(
    (totals, category) => {
      totals[category.id] = category.items.reduce(
        (sum, item) => sum + getAssetTotal(item),
        0,
      );
      return totals;
    },
    {},
  );

  const netWorth = Object.values(categoryTotals).reduce(
    (sum, total) => sum + total,
    0,
  );

  return { categoryTotals, netWorth };
}
