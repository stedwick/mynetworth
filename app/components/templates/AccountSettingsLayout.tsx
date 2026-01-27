import type { ReactNode } from "react";
import Link from "next/link";

import type { AccountNavItem } from "@/app/lib/account-nav";

const linkBaseClasses =
  "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition";

export default function AccountSettingsLayout({
  navItems,
  activePath,
  logoutHref,
  children,
}: {
  navItems: AccountNavItem[];
  activePath: string;
  logoutHref: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row lg:px-8">
        <aside className="w-full md:w-64">
          <div className="flex max-h-[calc(100vh-3rem)] flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Settings
            </div>
            <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
              <Link
                href="/"
                className={`${linkBaseClasses} text-white/70 hover:bg-white/5 hover:text-white`}
              >
                <span>Home</span>
              </Link>
              {navItems.map((item) => {
                const isActive = item.path === activePath;
                return (
                  <Link
                    key={item.path}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`${linkBaseClasses} ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive ? (
                      <span className="text-xs text-white/50">●</span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto pt-6">
              <Link
                href={logoutHref}
                className={`${linkBaseClasses} w-full justify-center border border-white/10 text-white/80 hover:border-white/30 hover:bg-white/5`}
              >
                Log out
              </Link>
            </div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
