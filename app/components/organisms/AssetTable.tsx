import { Fragment } from "react";
import Image from "next/image";

import {
  getAssetTotal,
  computeNetWorthSummary,
  type AssetCategory,
  type AssetItem,
} from "@/app/lib/networth";
import ScrollableTableContainer from "@/app/components/organisms/ScrollableTableContainer";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatQuantity(value: number) {
  return quantityFormatter.format(value);
}

function getTotalColorClass(value: number) {
  if (value > 0) {
    return "text-emerald-600 dark:text-emerald-400";
  }

  if (value < 0) {
    return "text-rose-600 dark:text-rose-400";
  }

  return "text-slate-900 dark:text-white";
}

const assetKindIconMap = {
  stock: { src: "/icons8/stocks-color.png", label: "Stock" },
  crypto: { src: "/icons8/crypto-color.png", label: "Crypto" },
  wallet: { src: "/icons8/wallet-color.png", label: "Wallet" },
  manual: { src: "/icons8/manual-color.png", label: "Manual entry" },
} satisfies Record<AssetItem["kind"], { src: string; label: string }>;

const cryptoIconMap: Record<string, { src: string; label: string }> = {
  BTC: { src: "/icons8/bitcoin-color.png", label: "Bitcoin" },
  ETH: { src: "/icons8/ethereum-color.png", label: "Ethereum" },
  SOL: { src: "/icons8/solana-color.png", label: "Solana" },
};

function getAssetIcon(item: AssetItem) {
  if (item.kind === "crypto") {
    return cryptoIconMap[item.ticker.toUpperCase()] ?? assetKindIconMap.crypto;
  }

  return assetKindIconMap[item.kind];
}

function getAssetKindLabel(item: AssetItem) {
  if (item.kind !== "wallet") {
    return assetKindIconMap[item.kind].label;
  }

  if (item.walletNetwork === "bitcoin") {
    return "Bitcoin wallet";
  }

  if (item.walletNetwork === "evm") {
    return "EVM wallet";
  }

  return "Solana wallet";
}

export default function AssetTable({
  categories,
}: {
  categories: AssetCategory[];
}) {
  const { categoryTotals } = computeNetWorthSummary(categories);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Assets
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/60">
          Mock holdings across investment categories with USD pricing.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/5">
        <ScrollableTableContainer>
          <table className="w-full min-w-208 table-fixed text-left text-sm">
            <thead className="border-b border-slate-200/70 bg-slate-50/80 text-xs uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
              <tr>
                <th className="w-28 px-4 py-3 font-semibold">Ticker</th>
                <th className="w-44 px-4 py-3 font-semibold">Name</th>
                <th className="w-28 px-4 py-3 font-semibold">Price</th>
                <th className="w-16 px-4 py-3 font-semibold">Qty</th>
                <th className="w-32 px-4 py-3 text-right font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
              {categories.map((category, index) => (
                <Fragment key={category.id}>
                  {index > 0 ? (
                    <tr aria-hidden="true">
                      <td colSpan={5} className="h-4 bg-transparent" />
                    </tr>
                  ) : null}
                  <tr
                    className={`bg-slate-50/80 dark:bg-white/5 ${
                      index > 0
                        ? "border-t border-slate-200/70 dark:border-white/10"
                        : ""
                    }`}
                  >
                    <th
                      colSpan={5}
                      className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-white/60"
                    >
                      <div className="flex w-full items-center gap-3">
                        <span>{category.label}</span>
                        <button
                          type="button"
                          className="scroll-hint scroll-hint-button sticky right-4 ml-auto inline-flex items-center gap-1 rounded-full border border-neutral-200/70 bg-neutral-100/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 shadow-sm transition hover:bg-neutral-200/90 hover:text-neutral-700 dark:border-white/10 dark:bg-neutral-900/90 dark:text-white/60 dark:hover:bg-neutral-800/90 dark:hover:text-white"
                          aria-label={`Scroll ${category.label} assets`}
                        >
                          <span>Scroll</span>
                          <span aria-hidden="true">→</span>
                        </button>
                      </div>
                    </th>
                  </tr>
                  {category.items.map((item, itemIndex) => {
                    const total = getAssetTotal(item);
                    const icon = getAssetIcon(item);
                    const isDebt = total < 0;
                    return (
                      <tr key={`${category.id}-${item.ticker}-${itemIndex}`}>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-white/60">
                          <span className="flex min-w-0 items-center gap-2">
                            <Image
                              src={icon.src}
                              alt=""
                              aria-hidden="true"
                              className="h-5 w-5"
                              width={20}
                              height={20}
                              loading="lazy"
                            />
                            <span>{item.ticker}</span>
                            {isDebt ? (
                              <Image
                                src="/icons8/debt-color.png"
                                alt="Debt"
                                className="h-4 w-4"
                                width={16}
                                height={16}
                                loading="lazy"
                              />
                            ) : null}
                          </span>
                        </td>
                        <td className="w-44 px-4 py-3 text-slate-900 dark:text-white">
                          <div className="space-y-1">
                            <div className="min-w-0 truncate">{item.name}</div>
                            <div className="text-xs text-slate-500 dark:text-white/50">
                              {getAssetKindLabel(item)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-white/70">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="w-16 px-4 py-3 text-slate-700 dark:text-white/70">
                          {formatQuantity(item.quantity)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right ${getTotalColorClass(
                            total,
                          )}`}
                        >
                          {formatCurrency(total)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-50/80 dark:bg-white/5">
                    <td colSpan={4} className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700 dark:text-white/70">
                        <span>{category.label} total</span>
                      </div>
                    </td>
                    <td className="asset-sticky-total px-4 py-3 text-right">
                      <span
                        className={`text-sm font-semibold ${getTotalColorClass(
                          categoryTotals[category.id] ?? 0,
                        )}`}
                      >
                        {formatCurrency(categoryTotals[category.id] ?? 0)}
                      </span>
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </ScrollableTableContainer>
      </div>
    </section>
  );
}
