import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { accountViewPaths } from "@neondatabase/auth/react/ui/server";

import type { AccountNavItem } from "@/app/lib/account-nav";
import MobileSidebarDialog from "@/app/components/organisms/MobileSidebarDialog";

const navIconMap: Record<string, { src: string; alt: string }> = {
  home: { src: "/icons8/home.png", alt: "Home" },
  [accountViewPaths.SETTINGS]: { src: "/icons8/user.png", alt: "Account" },
  [accountViewPaths.SECURITY]: { src: "/icons8/lock.png", alt: "Security" },
};

function SidebarContent({
  navItems,
  activePath,
  logoutHref,
}: {
  navItems: AccountNavItem[];
  activePath: string;
  logoutHref: string;
}) {
  return (
    <>
      <div className="app-sidebar-label">Settings</div>
      <nav className="app-sidebar-nav">
        <Link href="/" className="app-sidebar-link">
          <span className="app-sidebar-link-content">
            <Image
              src={navIconMap.home.src}
              alt=""
              aria-hidden="true"
              className="app-sidebar-icon"
              width={18}
              height={18}
              loading="lazy"
            />
            <span>Home</span>
          </span>
        </Link>
        {navItems.map((item) => {
          const isActive = item.path === activePath;
          const icon = navIconMap[item.path];
          return (
            <Link
              key={item.path}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`app-sidebar-link ${
                isActive ? "app-sidebar-link-active" : ""
              }`}
            >
              <span className="app-sidebar-link-content">
                {icon ? (
                  <Image
                    src={icon.src}
                    alt=""
                    aria-hidden="true"
                    className="app-sidebar-icon"
                    width={18}
                    height={18}
                    loading="lazy"
                  />
                ) : null}
                <span>{item.label}</span>
              </span>
              {isActive ? (
                <span className="text-xs text-slate-400 dark:text-white/50">
                  ●
                </span>
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
    </>
  );
}

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
  const renderSidebarContent = () => (
    <div className="flex min-h-full flex-col">
      <SidebarContent
        navItems={navItems}
        activePath={activePath}
        logoutHref={logoutHref}
      />
    </div>
  );

  return (
    <div className="app-shell">
      <MobileSidebarDialog title="Menu">
        {renderSidebarContent()}
      </MobileSidebarDialog>
      <div className="app-shell-inner">
        <aside className="hidden w-full md:block md:w-72">
          <div className="flex h-[calc(100vh-3rem)] flex-col rounded-2xl border border-slate-300/30 bg-white/95 p-4 shadow-[12px_0_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-400/25 dark:bg-slate-900/90 dark:shadow-[18px_0_30px_rgba(0,0,0,0.3)]">
            {renderSidebarContent()}
          </div>
        </aside>
        <main className="app-surface">{children}</main>
      </div>
    </div>
  );
}
