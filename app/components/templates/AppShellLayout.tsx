import type { ReactNode } from "react";

import AppSidebar from "@/app/components/organisms/AppSidebar";
import MobileSidebarDialog from "@/app/components/organisms/MobileSidebarDialog";

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <MobileSidebarDialog title="Menu">
        <AppSidebar />
      </MobileSidebarDialog>
      <div className="app-shell-inner">
        <aside className="hidden w-full md:block md:w-72">
          <div className="flex h-[calc(100vh-3rem)] flex-col rounded-2xl border border-slate-300/30 bg-white/95 p-4 shadow-[12px_0_24px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-400/25 dark:bg-slate-900/90 dark:shadow-[18px_0_30px_rgba(0,0,0,0.3)]">
            <AppSidebar />
          </div>
        </aside>
        <main className="app-surface">{children}</main>
      </div>
    </div>
  );
}
