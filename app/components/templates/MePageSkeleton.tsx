const skeletonCell = "h-3 w-full rounded-full bg-slate-200/70 dark:bg-white/10";

export default function MePageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <section className="space-y-2">
        <div className="h-3 w-32 rounded-full bg-slate-200/70 dark:bg-white/10" />
        <div className="h-9 w-48 rounded-lg bg-slate-200/70 dark:bg-white/10" />
        <div className="h-3 w-40 rounded-full bg-slate-200/70 dark:bg-white/10" />
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <div className="h-5 w-24 rounded bg-slate-200/70 dark:bg-white/10" />
          <div className="h-4 w-64 rounded bg-slate-200/70 dark:bg-white/10" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-208 table-fixed text-left text-sm">
              <thead className="border-b border-slate-200/70 bg-slate-50/80 text-xs uppercase tracking-[0.2em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
                <tr>
                  <th className="w-6 px-1.5 py-3">
                    <div className="h-3 w-3 rounded bg-slate-200/70 dark:bg-white/10" />
                  </th>
                  <th className="w-28 px-4 py-3">
                    <div className="h-3 w-16 rounded bg-slate-200/70 dark:bg-white/10" />
                  </th>
                  <th className="w-44 px-4 py-3">
                    <div className="h-3 w-20 rounded bg-slate-200/70 dark:bg-white/10" />
                  </th>
                  <th className="w-28 px-4 py-3">
                    <div className="h-3 w-14 rounded bg-slate-200/70 dark:bg-white/10" />
                  </th>
                  <th className="w-16 px-4 py-3">
                    <div className="h-3 w-10 rounded bg-slate-200/70 dark:bg-white/10" />
                  </th>
                  <th className="w-32 px-4 py-3 text-right">
                    <div className="ml-auto h-3 w-16 rounded bg-slate-200/70 dark:bg-white/10" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                {Array.from({ length: 6 }).map((_, index) => (
                  <tr
                    key={`row-${index}`}
                    className="bg-white/40 dark:bg-white/0"
                  >
                    <td className="px-1.5 py-3">
                      <div className="h-3 w-3 rounded bg-slate-200/70 dark:bg-white/10" />
                    </td>
                    <td className="px-4 py-3">
                      <div className={skeletonCell} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={skeletonCell} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={skeletonCell} />
                    </td>
                    <td className="px-4 py-3">
                      <div className={skeletonCell} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="ml-auto h-3 w-20 rounded-full bg-slate-200/70 dark:bg-white/10" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-full rounded-full bg-slate-200/70 dark:bg-white/10 sm:w-40" />
          <div className="h-10 w-full rounded-full bg-slate-200/70 dark:bg-white/10 sm:w-40" />
        </div>
      </section>
    </div>
  );
}
