import Link from "next/link";

const highlightItems = [
  {
    title: "All asset types",
    description:
      "Stocks, ETFs, mutual funds, crypto, credit cards, plus houses and cars.",
  },
  {
    title: "Private by design",
    description: "Never connects to your bank. Your data stays with you.",
  },
  {
    title: "Fresh within the hour",
    description: "Prices stay up to date within an hour, without the noise.",
  },
];

const featureItems = [
  {
    tag: "NW",
    title: "Net worth at a glance",
    description: "See the total and what moved without digging through tabs.",
  },
  {
    tag: "AU",
    title: "Any asset, one view",
    description:
      "Track stocks, ETFs, mutual funds, crypto, credit cards, and real assets.",
  },
  {
    tag: "PR",
    title: "Private by default",
    description: "No bank connections or syncs. You decide what goes in.",
  },
  {
    tag: "HR",
    title: "Hourly refresh",
    description: "Market prices stay current within an hour when you refresh.",
  },
  {
    tag: "CF",
    title: "Category-first organization",
    description:
      "Group assets the way your brain works, not the way a bank does.",
  },
  {
    tag: "FR",
    title: "Focused refresh",
    description: "Update values quickly so the dashboard always feels current.",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "Add your assets",
    description: "List what you own, from cash to long-term holdings.",
  },
  {
    step: "02",
    title: "Track liabilities",
    description: "Balance the picture with mortgages, loans, and cards.",
  },
  {
    step: "03",
    title: "Refresh within the hour",
    description: "Update prices fast so totals always feel current.",
  },
];

const useCases = [
  {
    title: "Households",
    description:
      "Shared money, shared clarity. Stay aligned on the big number.",
  },
  {
    title: "Solo operators",
    description: "Keep personal and business wealth in one steady view.",
  },
  {
    title: "Investors",
    description: "See allocation drift and rebalance with confidence.",
  },
];

export default function HomePageTemplate() {
  return (
    <div
      className="-m-4 min-h-full overflow-hidden rounded-2xl bg-(--page-bg) text-(--page-ink) sm:-m-6 [--page-bg:#f7f4ef] [--page-ink:#0f172a] [--page-muted:#64748b] [--page-muted-strong:#475569] [--page-surface:rgba(255,255,255,0.7)] [--page-surface-strong:rgba(255,255,255,0.9)] [--page-border:rgba(226,232,240,0.7)] [--page-border-strong:#e2e8f0] [--page-chip-bg:rgba(255,255,255,0.9)] [--page-chip-border:rgba(226,232,240,0.8)] [--page-chip-text:#64748b] [--page-chip-hover-bg:#e2e8f0] [--page-chip-hover-text:#475569] [--page-cta-bg:#0f172a] [--page-cta-fg:#ffffff] [--page-cta-hover:#020617] [--page-cta-border:#0f172a] [--page-ghost-bg:rgba(255,255,255,0.9)] [--page-ghost-fg:#0f172a] [--page-ghost-hover:#f1f5f9] [--page-ghost-border:#0f172a] [--page-strong-bg:#0f172a] [--page-strong-fg:#ffffff] [--page-contrast-bg:#0f172a] [--page-contrast-fg:#ffffff] [--page-contrast-muted:rgba(255,255,255,0.7)] [--page-accent:#f59e0b] [--page-accent-soft:#fef3c7] [--page-accent-2:#0ea5e9] [--page-accent-3:#14b8a6] [--page-glow-1:rgba(245,158,11,0.35)] [--page-glow-2:rgba(14,165,233,0.22)] [--page-glow-3:rgba(20,184,166,0.22)] [--page-grid:rgba(15,23,42,0.08)] dark:[--page-bg:#0b1120] dark:[--page-ink:#f8fafc] dark:[--page-muted:#94a3b8] dark:[--page-muted-strong:#cbd5f5] dark:[--page-surface:rgba(15,23,42,0.78)] dark:[--page-surface-strong:rgba(15,23,42,0.95)] dark:[--page-border:rgba(51,65,85,0.7)] dark:[--page-border-strong:#1f2937] dark:[--page-chip-bg:rgba(15,23,42,0.9)] dark:[--page-chip-border:rgba(51,65,85,0.8)] dark:[--page-chip-text:#cbd5f5] dark:[--page-chip-hover-bg:#1f2937] dark:[--page-chip-hover-text:#f8fafc] dark:[--page-cta-bg:#38bdf8] dark:[--page-cta-fg:#0b1120] dark:[--page-cta-hover:#7dd3fc] dark:[--page-cta-border:#38bdf8] dark:[--page-ghost-bg:#0f172a] dark:[--page-ghost-fg:#e2e8f0] dark:[--page-ghost-hover:#111827] dark:[--page-ghost-border:#334155] dark:[--page-strong-bg:#38bdf8] dark:[--page-strong-fg:#0b1120] dark:[--page-contrast-bg:#0f172a] dark:[--page-contrast-fg:#e2e8f0] dark:[--page-contrast-muted:rgba(226,232,240,0.75)] dark:[--page-accent:#38bdf8] dark:[--page-accent-soft:#0c4a6e] dark:[--page-accent-2:#60a5fa] dark:[--page-accent-3:#2dd4bf] dark:[--page-glow-1:rgba(56,189,248,0.25)] dark:[--page-glow-2:rgba(59,130,246,0.2)] dark:[--page-glow-3:rgba(45,212,191,0.18)] dark:[--page-grid:rgba(148,163,184,0.08)]"
    >
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--page-glow-1),transparent_60%)] blur-3xl" />
          <div className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--page-glow-2),transparent_60%)] blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,var(--page-glow-3),transparent_60%)] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--page-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--page-grid)_1px,transparent_1px)] bg-size-[28px_28px] opacity-40" />
        </div>

        <div className="relative">
          <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-10 sm:px-6 lg:px-8 lg:pt-16">
            <section
              id="overview"
              className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-(--page-muted)">
                  Privacy first
                </p>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.05] text-(--page-ink) sm:text-5xl lg:text-6xl">
                  Your net worth deserves a quiet home.
                </h1>
                <p className="mt-4 max-w-xl text-base text-(--page-muted) sm:text-lg">
                  Focused design, secure access, and no noisy dashboards. Keep
                  the data where it belongs and the decisions where you are
                  strongest.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/auth/sign-up"
                    className="inline-flex items-center justify-center rounded-full border-2 border-(--page-cta-border) bg-(--page-cta-bg) px-6 py-3 text-sm font-semibold text-(--page-cta-fg) shadow-sm transition hover:bg-(--page-cta-hover) hover:shadow-md active:bg-(--page-cta-hover) active:shadow-sm"
                  >
                    Create your dashboard
                  </Link>
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 hover:shadow-md active:bg-emerald-700 active:shadow-sm"
                  >
                    View demo
                  </Link>
                </div>
                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {highlightItems.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-(--page-border) bg-(--page-surface) p-4 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-(--page-ink)">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm text-(--page-muted)">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-8 h-40 w-40 rounded-full border border-(--page-border) bg-(--page-surface) shadow-sm" />
                <div className="absolute -bottom-6 right-10 h-20 w-20 rounded-2xl border border-(--page-border) bg-(--page-surface-strong) shadow-sm" />
                <div className="relative rounded-4xl border border-(--page-border) bg-(--page-surface-strong) p-6 shadow-2xl backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-(--page-muted)">
                        Supported assets
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-(--page-ink)">
                        Markets + real life
                      </p>
                      <p className="mt-1 text-xs text-(--page-muted)">
                        Everything in one private view.
                      </p>
                    </div>
                    <div className="rounded-full bg-(--page-strong-bg) px-3 py-1 text-xs font-semibold text-(--page-strong-fg)">
                      No bank connections
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {[
                      "Stocks",
                      "ETFs",
                      "Mutual funds",
                      "Crypto",
                      "Credit cards",
                      "Houses",
                      "Cars",
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-(--page-chip-border) bg-(--page-chip-bg) px-3 py-1 text-xs font-semibold text-(--page-chip-text)"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-(--page-border) bg-(--page-surface) p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--page-muted)">
                        Privacy first
                      </p>
                      <p className="mt-2 text-sm font-semibold text-(--page-ink)">
                        Never connects to your bank.
                      </p>
                    </div>
                    <div className="rounded-xl border border-(--page-border) bg-(--page-surface) p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--page-muted)">
                        Hourly updates
                      </p>
                      <p className="mt-2 text-sm font-semibold text-(--page-ink)">
                        Prices stay current within an hour.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-dashed border-(--page-border-strong) bg-(--page-surface) px-4 py-3 text-xs text-(--page-muted)">
                    Demo data only - your real data stays private.
                  </div>
                </div>
              </div>
            </section>

            <section id="features" className="mt-16">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-(--page-muted)">
                    Features
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-(--page-ink) sm:text-4xl">
                    A net worth hub that stays lightweight.
                  </h2>
                </div>
                <Link
                  href="/me"
                  className="inline-flex items-center justify-center rounded-full border-2 border-(--page-ghost-border) bg-(--page-ghost-bg) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--page-ghost-fg) shadow-sm transition hover:bg-(--page-ghost-hover) hover:shadow-md active:bg-(--page-ghost-hover) active:shadow-sm"
                >
                  Open portfolio
                </Link>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featureItems.map((item) => (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-(--page-border) bg-(--page-surface) p-5 shadow-sm transition hover:-translate-y-1 hover:border-(--page-border-strong) hover:bg-(--page-surface-strong)"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--page-strong-bg) text-sm font-semibold text-(--page-strong-fg) shadow-sm">
                      {item.tag}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-(--page-ink)">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-(--page-muted)">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="workflow" className="mt-16">
              <div className="rounded-3xl border border-(--page-border) bg-(--page-surface-strong) p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-(--page-muted)">
                      Workflow
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-(--page-ink)">
                      Build your net worth rhythm.
                    </h2>
                  </div>
                  <p className="max-w-md text-sm text-(--page-muted)">
                    Keep it simple: add, update, and review. The dashboard does
                    the heavy lifting.
                  </p>
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  {workflowSteps.map((item) => (
                    <div
                      key={item.step}
                      className="rounded-2xl border border-(--page-border) bg-(--page-surface) p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-(--page-muted)">
                        {item.step}
                      </p>
                      <h3 className="mt-3 text-lg font-semibold text-(--page-ink)">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-(--page-muted)">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="use-cases" className="mt-16">
              <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-(--page-muted)">
                    Use cases
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-(--page-ink)">
                    Built for every money story.
                  </h2>
                  <p className="mt-4 text-sm text-(--page-muted)">
                    Whether you are tracking a household, a solo venture, or a
                    growing portfolio, My Net Worth keeps the picture clear.
                  </p>
                  <div className="mt-6 grid gap-4">
                    {useCases.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-(--page-border) bg-(--page-surface) p-5"
                      >
                        <h3 className="text-lg font-semibold text-(--page-ink)">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm text-(--page-muted)">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="rounded-3xl border border-(--page-border) bg-(--page-surface-strong) p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-(--page-muted)">
                      Ready to feel clear
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-(--page-ink)">
                      Stop guessing. Start tracking.
                    </h3>
                    <p className="mt-3 text-sm text-(--page-muted)">
                      Launch your dashboard in minutes and keep your net worth
                      conversation simple.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href="/auth/sign-up"
                        className="inline-flex items-center justify-center rounded-full border-2 border-(--page-cta-border) bg-(--page-cta-bg) px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--page-cta-fg) shadow-sm transition hover:bg-(--page-cta-hover) hover:shadow-md active:bg-(--page-cta-hover) active:shadow-sm"
                      >
                        Create account
                      </Link>
                      <Link
                        href="/demo"
                        className="inline-flex items-center justify-center rounded-full border-2 border-(--page-ghost-border) bg-(--page-ghost-bg) px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--page-ghost-fg) shadow-sm transition hover:bg-(--page-ghost-hover) hover:shadow-md active:bg-(--page-ghost-hover) active:shadow-sm"
                      >
                        Explore demo
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-16 rounded-3xl border border-(--page-border) bg-(--page-contrast-bg) px-6 py-10 text-center text-(--page-contrast-fg) shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-(--page-contrast-muted)">
                Privacy first
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                Your net worth stays yours.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-(--page-contrast-muted)">
                My Net Worth never connects to your bank. You stay in control,
                and prices update within an hour when you refresh.
              </p>
            </section>

            <footer className="mt-12 border-t border-(--page-border) py-8 text-center text-xs text-(--page-muted)">
              <p>My Net Worth - a calmer way to track wealth.</p>
            </footer>
          </main>
          <div className="pointer-events-none fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
            <Link
              href="/demo"
              className="pointer-events-auto inline-flex items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-400/40 transition hover:bg-emerald-500 hover:shadow-emerald-300/50 active:bg-emerald-700 active:shadow-emerald-400/40 motion-safe:animate-bounce motion-reduce:animate-none"
            >
              View demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
