import {
  formatUsd,
  getAssetTotal,
  type AssetCategory,
} from "@/app/lib/networth";

import EditLink from "@/app/components/atoms/EditLink";
import AssetRow from "@/app/components/molecules/AssetRow";
import { getTotalColorClass } from "@/app/components/organisms/assetTableUtils";

export default function AssetCategorySection({
  category,
}: {
  category: AssetCategory;
}) {
  const hasItems = category.items.length > 0;
  const total = category.items.reduce(
    (sum, item) => sum + getAssetTotal(item),
    0,
  );

  return (
    <>
      <tr className="group bg-slate-50/80 dark:bg-white/5">
        <th className="w-6 px-1.5 py-2 text-center align-middle">
          <EditLink
            label={`Edit ${category.label}`}
            href={`/categories/${encodeURIComponent(category.id)}/edit`}
          />
        </th>
        <th className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-white/60">
          {category.label}
        </th>
        <th
          colSpan={4}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-white/60"
        >
          <div className="flex w-full items-center">
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
      {hasItems ? (
        category.items.map((item) => <AssetRow key={item.id} item={item} />)
      ) : (
        <tr>
          <td
            colSpan={6}
            className="px-6 py-6 text-left text-sm text-slate-500 dark:text-white/60 sm:text-center"
          >
            No assets in {category.label} yet. Add your first asset to start
            tracking.
          </td>
        </tr>
      )}
      <tr className="bg-slate-50/80 dark:bg-white/5">
        <td colSpan={5} className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-700 dark:text-white/70">
            <span>{category.label} total</span>
          </div>
        </td>
        <td className="asset-sticky-total px-4 py-3 text-right">
          <span
            className={`text-sm font-semibold ${getTotalColorClass(total)}`}
          >
            {formatUsd(total)}
          </span>
        </td>
      </tr>
    </>
  );
}
