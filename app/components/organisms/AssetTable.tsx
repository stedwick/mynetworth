import { Fragment } from "react";
import Link from "next/link";
import Image from "next/image";

import type { AssetCategory } from "@/app/lib/networth";
import AssetCategorySection from "@/app/components/molecules/AssetCategorySection";
import ScrollableTableContainer from "@/app/components/organisms/ScrollableTableContainer";

export default function AssetTable({
  categories,
}: {
  categories: AssetCategory[];
}) {
  const hasAssets = categories.some((category) => category.items.length > 0);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Assets
        </h2>
        <p className="text-sm text-slate-500 dark:text-white/60">
          Holdings across investment categories with USD pricing.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/5">
        <ScrollableTableContainer>
          <table className="w-full min-w-208 table-fixed text-left text-sm">
            <thead className="border-b border-slate-200/70 bg-slate-50/80 text-xs uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
              <tr>
                <th className="w-6 px-1.5 py-3 text-center font-semibold">
                  <span className="sr-only">Edit</span>
                </th>
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
              {!hasAssets ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-left text-sm text-slate-500 dark:text-white/60 sm:text-center"
                  >
                    Welcome to My Net Worth! Add your first asset to start
                    tracking.
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <Fragment key={category.id}>
                    {index > 0 ? (
                      <tr
                        aria-hidden="true"
                        className="border-t border-slate-200/70 dark:border-white/10"
                      >
                        <td colSpan={6} className="h-4 bg-transparent" />
                      </tr>
                    ) : null}
                    <AssetCategorySection category={category} />
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </ScrollableTableContainer>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/categories/new"
          className="category-add-button app-button w-full sm:w-auto"
        >
          <Image
            src="/icons8/plus.png"
            alt=""
            aria-hidden="true"
            className="icon-light-dark h-4 w-4"
            width={16}
            height={16}
            loading="lazy"
          />
          New category
        </Link>
        <Link
          href="/assets/new"
          className="asset-add-button app-button app-button-primary w-full sm:w-auto"
        >
          <Image
            src="/icons8/plus.png"
            alt=""
            aria-hidden="true"
            className="icon-on-primary h-4 w-4"
            width={16}
            height={16}
            loading="lazy"
          />
          Add Asset
        </Link>
      </div>
    </section>
  );
}
