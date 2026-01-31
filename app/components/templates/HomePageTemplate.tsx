import Link from "next/link";

const navItems = [
  { label: "Homepage", href: "/" },
  { label: "My Portfolio", href: "/me" },
  { label: "View Demo", href: "/demo" },
  { label: "Update Email", href: "/account/settings" },
  { label: "Update Password", href: "/account/security" },
];

export default function HomePageTemplate({ version }: { version: string }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.12),transparent_60%)]">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                MyNetWorth
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Track your net worth in one place
              </h1>
            </div>
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Connected database
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            PostgreSQL Version: {version}
          </p>
        </section>
      </main>
    </div>
  );
}
