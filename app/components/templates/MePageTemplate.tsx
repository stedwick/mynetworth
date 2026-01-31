import type { AssetCategory } from "@/app/lib/networth";
import AssetTable from "@/app/components/organisms/AssetTable";
import AppShellLayout from "@/app/components/templates/AppShellLayout";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export default function MePageTemplate({
  activeHref,
  logoutHref,
  categories,
  categoryTotals,
  netWorth,
}: {
  activeHref: string;
  logoutHref?: string;
  categories: AssetCategory[];
  categoryTotals: Record<string, number>;
  netWorth: number;
}) {
  return (
    <AppShellLayout activeHref={activeHref} logoutHref={logoutHref}>
      <div className="space-y-8">
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
            Total net worth
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
            {formatCurrency(netWorth)}
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/60">
            Mock snapshot based on your portfolio, retirement, property, and
            cash accounts.
          </p>
        </section>

        <AssetTable categories={categories} categoryTotals={categoryTotals} />
      </div>
    </AppShellLayout>
  );
}
