import type { ReactNode } from "react";

import AppShellLayout from "@/app/components/templates/AppShellLayout";

export default function AccountSettingsLayout({
  activePath,
  logoutHref,
  children,
}: {
  activePath: string;
  logoutHref: string;
  children: ReactNode;
}) {
  const activeHref = `/account/${activePath}`;
  return (
    <AppShellLayout activeHref={activeHref} logoutHref={logoutHref}>
      {children}
    </AppShellLayout>
  );
}
