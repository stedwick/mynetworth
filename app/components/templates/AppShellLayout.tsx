import type { ReactNode } from "react";

import AppSidebar from "@/app/components/organisms/AppSidebar";
import MobileSidebarShell from "@/app/components/organisms/MobileSidebarShell";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <MobileSidebarShell />
      <div className="app-shell-inner">
        <main className="app-surface">{children}</main>
      </div>
    </div>
  );
}
