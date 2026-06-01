import {
  computeNetWorthSummary,
  formatUsd,
  type AssetCategory,
} from "@/app/lib/networth";
import RefreshButton from "@/app/components/atoms/RefreshButton";
import AssetTable from "@/app/components/organisms/AssetTable";
import { refreshAssetPrices } from "@/app/me/actions";

export default function MePageTemplate({
  categories,
}: {
  categories: AssetCategory[];
}) {
  const { netWorth } = computeNetWorthSummary(categories);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
            Total net worth
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
            {formatUsd(netWorth)}
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/60">
            Prices refresh from live APIs.
          </p>
        </div>
        <form action={refreshAssetPrices} className="w-full sm:w-auto">
          <RefreshButton />
        </form>
      </section>

      <AssetTable categories={categories} />
    </div>
  );
}
