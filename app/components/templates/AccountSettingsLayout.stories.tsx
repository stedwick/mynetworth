import AccountSettingsLayout from "./AccountSettingsLayout";

const navItems = [
  { path: "settings", label: "Account", href: "/account/settings" },
  { path: "security", label: "Security", href: "/account/security" },
  { path: "teams", label: "Teams", href: "/account/teams" },
];

const meta = {
  title: "Account/AccountSettingsLayout",
  component: AccountSettingsLayout,
};

export default meta;

export const Default = {
  render: () => (
    <AccountSettingsLayout
      navItems={navItems}
      activePath="settings"
      logoutHref="/auth/sign-out"
    >
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white">
        Account settings content
      </div>
    </AccountSettingsLayout>
  ),
};
