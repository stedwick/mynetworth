const skeletonBlock = "rounded-lg bg-slate-200/70 dark:bg-white/10";

const SkeletonField = () => (
  <div className="space-y-2">
    <div className="h-3 w-24 rounded-full bg-slate-200/70 dark:bg-white/10" />
    <div className={`h-11 w-full ${skeletonBlock}`} />
  </div>
);

const SkeletonRadioGroup = () => (
  <div className="space-y-3 sm:col-span-2">
    <div className="h-3 w-28 rounded-full bg-slate-200/70 dark:bg-white/10" />
    <div className="grid gap-2 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`radio-${index}`}
          className={`h-11 w-full ${skeletonBlock}`}
        />
      ))}
    </div>
    <div className="h-3 w-80 rounded-full bg-slate-200/70 dark:bg-white/10" />
  </div>
);

export default function AssetEditPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <header className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-slate-200/70 dark:bg-white/10" />
        <div className={`h-8 w-48 ${skeletonBlock}`} />
        <div className={`h-4 w-64 ${skeletonBlock}`} />
      </header>

      <div className="space-y-6">
        <div className="h-3 w-48 rounded-full bg-slate-200/70 dark:bg-white/10" />
        <div className="grid gap-6 sm:grid-cols-2">
          <SkeletonRadioGroup />
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
          <SkeletonField />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="h-10 w-28 rounded-full bg-slate-200/70 dark:bg-white/10" />
            <div className="h-10 w-32 rounded-full bg-slate-200/70 dark:bg-white/10" />
          </div>
          <div className="h-10 w-36 rounded-full bg-slate-200/70 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}
