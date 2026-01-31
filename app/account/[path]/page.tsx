import { AccountView } from "@neondatabase/auth/react/ui";
import { accountViewPaths } from "@neondatabase/auth/react/ui/server";

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

  return (
    <div className="mx-auto flex w-full max-w-md justify-center">
      <AccountView path={path} hideNav />
    </div>
  );
}
