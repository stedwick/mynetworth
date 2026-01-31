import { accountViewPaths } from "@neondatabase/auth/react/ui/server";

export type AccountNavItem = {
  path: string;
  label: string;
  href: string;
};

const accountNavOrder = [accountViewPaths.SETTINGS, accountViewPaths.SECURITY];

const accountNavLabels: Record<string, string> = {
  [accountViewPaths.SETTINGS]: "Update Email",
  [accountViewPaths.SECURITY]: "Update Password",
  [accountViewPaths.TEAMS]: "Teams",
  [accountViewPaths.API_KEYS]: "API Keys",
  [accountViewPaths.ORGANIZATIONS]: "Organizations",
};

export function getAccountNavItems(
  basePath: string = "/account",
): AccountNavItem[] {
  return accountNavOrder.map((path) => ({
    path,
    label: accountNavLabels[path] || path,
    href: `${basePath}/${path}`,
  }));
}
