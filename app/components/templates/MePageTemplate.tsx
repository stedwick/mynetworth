import { computeNetWorthSummary, type AssetCategory } from "@/app/lib/networth";
import AssetTable from "@/app/components/organisms/AssetTable";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

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
          {formatCurrency(netWorth)}
        </h1>
        <p className="text-sm text-slate-500 dark:text-white/60">
          Mock snapshot based on your portfolio, retirement, property, and cash
          accounts.
        </p>
      </section>

      <AssetTable categories={categories} />
    </div>
  );
}
