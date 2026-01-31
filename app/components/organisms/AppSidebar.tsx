import Image from "next/image";
import Link from "next/link";

const navItems = [
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
    icon: { src: "/icons8/user.png", alt: "Update Email" },
  },
  {
    id: "update-password",
    label: "Update Password",
    href: "/account/security",
    icon: { src: "/icons8/lock.png", alt: "Update Password" },
  },
];

export default function AppSidebar({
  activeHref,
  logoutHref,
}: {
  activeHref?: string;
  logoutHref?: string;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="app-sidebar-label">Menu</div>
      <nav className="app-sidebar-nav">
        {navItems.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <Link
              key={item.id}
              href={item.href}
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
                  className="app-sidebar-icon"
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
      {logoutHref ? (
        <div className="mt-auto pt-6">
          <Link
            href={logoutHref}
            className="app-button app-button-danger w-full justify-center"
          >
            Log out
          </Link>
        </div>
      ) : null}
    </div>
  );
}
