import type { ReactNode } from "react";
import Link from "next/link";

import type { AccountNavItem } from "@/app/lib/account-nav";

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
    <div className="app-shell">
      <div className="app-shell-inner">
        <aside className="w-full md:w-64">
          <div className="app-sidebar">
            <div className="app-sidebar-label">
              Settings
            </div>
            <nav className="app-sidebar-nav">
              <Link
                href="/"
                className="app-sidebar-link"
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
                    className={`app-sidebar-link ${
                      isActive ? "app-sidebar-link-active" : ""
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive ? (
                      <span className="text-xs text-slate-400 dark:text-white/50">●</span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto pt-6">
              <Link
                href={logoutHref}
                className="app-button app-button-danger w-full justify-center"
              >
                Log out
              </Link>
            </div>
          </div>
        </aside>
        <main className="app-surface">
          {children}
        </main>
      </div>
    </div>
  );
}
