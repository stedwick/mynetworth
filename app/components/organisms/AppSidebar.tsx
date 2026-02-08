"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { authViewPaths } from "@neondatabase/auth/react/ui";
import { authClient } from "@/lib/auth/client";

const mainNavItems = [
  {
    id: "home",
    label: "Homepage",
    href: "/",
    icon: { src: "/icons8/home.png", alt: "Homepage" },
  },
  {
    id: "portfolio",
    label: "My Portfolio",
    href: "/me",
    icon: { src: "/icons8/user.png", alt: "My Portfolio" },
  },
  {
    id: "demo",
    label: "View Demo",
    href: "/demo",
    icon: { src: "/icons8/menu.png", alt: "View Demo" },
  },
  {
    id: "update-email",
    label: "Update Email",
    href: "/account/settings",
    icon: { src: "/icons8/email.png", alt: "Update Email" },
  },
  {
    id: "update-password",
    label: "Update Password",
    href: "/account/security",
    icon: { src: "/icons8/lock.png", alt: "Update Password" },
  },
];

const legalNavItems = [
  {
    id: "privacy-policy",
    label: "Privacy Policy",
    href: "/privacy-policy",
    icon: { src: "/icons8/privacy-policy.png", alt: "Privacy Policy" },
  },
  {
    id: "terms-of-service",
    label: "Terms of Service",
    href: "/terms-of-service",
    icon: { src: "/icons8/check.png", alt: "Terms of Service" },
  },
];

export default function AppSidebar({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "";
  const logoutHref = `/auth/${authViewPaths.SIGN_OUT}`;
  const signInHref = `/auth/${authViewPaths.SIGN_IN}`;
  const handleNavigate = () => onNavigate?.();
  const { data } = authClient.useSession();
  const isAuthenticated = Boolean(data?.session);

  return (
    <div className="flex min-h-full flex-col">
      <div className="app-sidebar-label">Menu</div>
      <nav className="app-sidebar-nav">
        {mainNavItems.map((item) => {
          const isActive = item.href === pathname;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={handleNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`app-sidebar-link ${
                isActive ? "app-sidebar-link-active" : ""
              }`}
            >
              <span className="app-sidebar-link-content">
                <Image
                  src={item.icon.src}
                  alt=""
                  aria-hidden="true"
                  className="app-sidebar-icon icon-light-dark"
                  width={18}
                  height={18}
                  loading="lazy"
                />
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
        <hr className="my-2 border-slate-200/80 dark:border-white/10" />
        {legalNavItems.map((item) => {
          const isActive = item.href === pathname;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={handleNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`app-sidebar-link ${
                isActive ? "app-sidebar-link-active" : ""
              }`}
            >
              <span className="app-sidebar-link-content">
                <Image
                  src={item.icon.src}
                  alt=""
                  aria-hidden="true"
                  className="app-sidebar-icon icon-light-dark"
                  width={18}
                  height={18}
                  loading="lazy"
                />
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
        {isAuthenticated ? (
          <Link
            href={logoutHref}
            onClick={handleNavigate}
            className="app-button app-button-danger w-full justify-center"
          >
            Log out
          </Link>
        ) : (
          <Link
            href={signInHref}
            onClick={handleNavigate}
            className="app-button w-full justify-center"
          >
            Sign in / Sign up
          </Link>
        )}
      </div>
    </div>
  );
}
