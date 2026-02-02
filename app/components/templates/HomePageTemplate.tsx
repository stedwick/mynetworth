import type { CSSProperties } from "react";
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
    description:
      "See the total and what moved without digging through tabs.",
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
    description:
      "Market prices stay current within an hour when you refresh.",
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

const themeStyles = {
  "--ink": "#0f172a",
  "--night": "#111827",
  "--sand": "#f7f4ef",
  "--sun": "#f59e0b",
  "--mint": "#14b8a6",
  "--sky": "#0ea5e9",
} as CSSProperties;

export default function HomePageTemplate() {
  return (
    <div
      className="-m-4 min-h-full overflow-hidden rounded-2xl bg-(--sand) text-(--night) sm:-m-6"
      style={themeStyles}
    >
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.35),transparent_60%)] blur-3xl" />
          <div className="absolute -right-24 top-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.22),transparent_60%)] blur-3xl" />
          <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.22),transparent_60%)] blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.08)_1px,transparent_1px)] bg-size-[28px_28px] opacity-40" />
        </div>

        <div className="relative">
          <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-10 sm:px-6 lg:px-8 lg:pt-16">
            <section
              id="overview"
              className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                  Privacy first
                </p>
                <h1 className="mt-4 text-4xl font-semibold leading-[1.05] text-(--ink) sm:text-5xl lg:text-6xl">
                  Your net worth deserves a quiet home.
                </h1>
                <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">
                  Focused design, secure access, and no noisy dashboards. Keep
                  the data where it belongs and the decisions where you are
                  strongest.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/auth/sign-up"
                    className="inline-flex items-center justify-center rounded-full border-2 border-(--ink) bg-(--ink) px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-900 hover:shadow-md active:bg-slate-950 active:shadow-sm"
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
                      className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-(--ink)">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-8 h-40 w-40 rounded-full border border-slate-200/70 bg-white/70 shadow-sm" />
                <div className="absolute -bottom-6 right-10 h-20 w-20 rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm" />
                <div className="relative rounded-4xl border border-slate-200/70 bg-white/80 p-6 shadow-2xl backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        Supported assets
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-(--ink)">
                        Markets + real life
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Everything in one private view.
                      </p>
                    </div>
                    <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
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
                        className="rounded-full border border-slate-200/70 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-600"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-200/70 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Privacy first
                      </p>
                      <p className="mt-2 text-sm font-semibold text-(--ink)">
                        Never connects to your bank.
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Hourly updates
                      </p>
                      <p className="mt-2 text-sm font-semibold text-(--ink)">
                        Prices stay current within an hour.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                    Demo data only - your real data stays private.
                  </div>
                </div>
              </div>
            </section>

            <section id="features" className="mt-16">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Features
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-(--ink) sm:text-4xl">
                    A net worth hub that stays lightweight.
                  </h2>
                </div>
                <Link
                  href="/me"
                  className="inline-flex items-center justify-center rounded-full border-2 border-(--ink) bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--ink) shadow-sm transition hover:bg-slate-100 hover:shadow-md active:bg-slate-200 active:shadow-sm"
                >
                  Open portfolio
                </Link>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featureItems.map((item) => (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm transition hover:-translate-y-1 hover:border-slate-300"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-sm">
                      {item.tag}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-(--ink)">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="workflow" className="mt-16">
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                      Workflow
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold text-(--ink)">
                      Build your net worth rhythm.
                    </h2>
                  </div>
                  <p className="max-w-md text-sm text-slate-600">
                    Keep it simple: add, update, and review. The dashboard does
                    the heavy lifting.
                  </p>
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  {workflowSteps.map((item) => (
                    <div
                      key={item.step}
                      className="rounded-2xl border border-slate-200/70 bg-white/80 p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                        {item.step}
                      </p>
                      <h3 className="mt-3 text-lg font-semibold text-(--ink)">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">
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
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Use cases
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold text-(--ink)">
                    Built for every money story.
                  </h2>
                  <p className="mt-4 text-sm text-slate-600">
                    Whether you are tracking a household, a solo venture, or a
                    growing portfolio, My Net Worth keeps the picture clear.
                  </p>
                  <div className="mt-6 grid gap-4">
                    {useCases.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-slate-200/70 bg-white/70 p-5"
                      >
                        <h3 className="text-lg font-semibold text-(--ink)">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Ready to feel clear
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-(--ink)">
                      Stop guessing. Start tracking.
                    </h3>
                    <p className="mt-3 text-sm text-slate-600">
                      Launch your dashboard in minutes and keep your net worth
                      conversation simple.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Link
                        href="/auth/sign-up"
                        className="inline-flex items-center justify-center rounded-full border-2 border-(--ink) bg-(--ink) px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-slate-900 hover:shadow-md active:bg-slate-950 active:shadow-sm"
                      >
                        Create account
                      </Link>
                      <Link
                        href="/demo"
                        className="inline-flex items-center justify-center rounded-full border-2 border-(--ink) bg-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--ink) shadow-sm transition hover:bg-slate-100 hover:shadow-md active:bg-slate-200 active:shadow-sm"
                      >
                        Explore demo
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-16 rounded-3xl border border-slate-200/70 bg-(--ink) px-6 py-10 text-center text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">
                Privacy first
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                Your net worth stays yours.
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80">
                My Net Worth never connects to your bank. You stay in control,
                and prices update within an hour when you refresh.
              </p>
            </section>

            <footer className="mt-12 border-t border-slate-200/70 py-8 text-center text-xs text-slate-500">
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
