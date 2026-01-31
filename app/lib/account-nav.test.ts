import { describe, expect, test } from "bun:test";

import { getAccountNavItems } from "./account-nav";

describe("getAccountNavItems", () => {
  test("builds labeled account routes", () => {
    expect(getAccountNavItems()).toEqual([
      { path: "settings", label: "Update Email", href: "/account/settings" },
      { path: "security", label: "Update Password", href: "/account/security" },
    ]);
  });
});
