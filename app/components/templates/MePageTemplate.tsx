import {
  computeNetWorthSummary,
  formatUsd,
  type AssetCategory,
} from "@/app/lib/networth";
import AssetTable from "@/app/components/organisms/AssetTable";

export default function MePageTemplate({
  categories,
}: {
  categories: AssetCategory[];
}) {
  const { netWorth } = computeNetWorthSummary(categories);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
          Total net worth
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
          {formatUsd(netWorth)}
        </h1>
        <p className="text-sm text-slate-500 dark:text-white/60">
          Refreshes every hour.
        </p>
      </section>

      <AssetTable categories={categories} />
    </div>
  );
}
