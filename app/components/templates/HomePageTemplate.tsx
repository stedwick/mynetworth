import Image from "next/image";
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
    icon: "/icons8/statistics.png",
    title: "Net worth at a glance",
    description: "See the total and what moved without digging through tabs.",
  },
  {
    icon: "/icons8/layers.png",
    title: "Any asset, one view",
    description:
      "Track stocks, ETFs, mutual funds, crypto, credit cards, and real assets.",
  },
  {
    icon: "/icons8/security-lock.png",
    title: "Private by default",
    description: "No bank connections or syncs. You decide what goes in.",
  },
  {
    icon: "/icons8/clock.png",
    title: "Hourly refresh",
    description: "Market prices stay current within an hour when you refresh.",
  },
  {
    icon: "/icons8/categorize.png",
    title: "Category-first organization",
    description:
      "Group assets the way your brain works, not the way a bank does.",
  },
  {
    icon: "/icons8/target.png",
    title: "Progress over time",
    description: "See trends and milestones in one place without spreadsheets.",
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
    <div className="-m-4 min-h-full overflow-hidden rounded-2xl bg-(--page-bg) text-(--page-ink) sm:-m-6 home-page-theme">
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
            <section id="overview" className="grid gap-12">
              <div>
                <div className="float-right mb-3 ml-4 w-20 sm:w-24">
                  <Image
                    src="/icon-full.png"
                    alt="My Net Worth logo"
                    width={96}
                    height={96}
                    className="h-auto w-full"
                    priority
                  />
                </div>
                <h1 className="text-4xl font-semibold leading-[1.05] text-(--page-ink) sm:text-5xl lg:text-6xl">
                  Your net worth deserves a quiet home.
                </h1>
                <p className="mt-4 max-w-xl text-base text-(--page-muted) sm:text-lg">
                  Track every asset type in one calm dashboard, no spreadsheets
                  required.
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
                <div className="relative w-full rounded-4xl border border-(--page-border) bg-(--page-surface-strong) p-6 shadow-2xl backdrop-blur">
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
                  className="inline-flex items-center justify-center rounded-full border-2 border-(--page-cta-border) bg-(--page-cta-bg) px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-(--page-cta-fg) shadow-sm transition hover:bg-(--page-cta-hover) hover:shadow-md active:bg-(--page-cta-hover) active:shadow-sm"
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--page-surface-strong) shadow-sm">
                      <Image
                        src={item.icon}
                        alt={`${item.title} icon`}
                        width={32}
                        height={32}
                      />
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
              <div className="flex flex-col gap-8">
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
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                      className="inline-flex items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sm transition hover:bg-emerald-500 hover:shadow-md active:bg-emerald-700 active:shadow-sm"
                    >
                      Explore demo
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-16 rounded-3xl border border-(--page-border) bg-(--page-contrast-bg) px-6 py-10 text-center text-(--page-contrast-fg) shadow-sm">
              <h2 className="text-2xl font-semibold sm:text-3xl">
                My Net Worth - a calmer way to track wealth.
              </h2>
            </section>

            <footer className="mt-12 border-t border-(--page-border) py-8 text-center text-xs text-(--page-muted)">
              <Link
                href="/privacy-policy"
                className="font-semibold underline decoration-2 underline-offset-4 transition hover:text-(--page-ink)"
              >
                Privacy Policy
              </Link>
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
