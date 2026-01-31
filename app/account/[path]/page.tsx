import { AccountView } from "@neondatabase/auth/react/ui";
import { accountViewPaths, authViewPaths } from "@neondatabase/auth/react/ui/server";

import AccountSettingsLayout from "@/app/components/templates/AccountSettingsLayout";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;
  const logoutHref = `/auth/${authViewPaths.SIGN_OUT}`;

  return (
    <AccountSettingsLayout
      activePath={path}
      logoutHref={logoutHref}
    >
      <AccountView path={path} hideNav />
    </AccountSettingsLayout>
  );
}
