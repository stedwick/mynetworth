export default function DemoBannerFallback() {
  return (
    <div className="mb-6 rounded-2xl border border-amber-200/70 bg-linear-to-r from-amber-200 via-amber-100 to-yellow-50 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 rounded-full bg-amber-300/70" />
          <div className="h-4 w-72 rounded-full bg-amber-300/70" />
        </div>
        <div className="h-9 w-36 rounded-full bg-amber-400/70" />
      </div>
    </div>
  );
}
