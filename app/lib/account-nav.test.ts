import { describe, expect, test } from "bun:test";

import { getAccountNavItems } from "./account-nav";

describe("getAccountNavItems", () => {
  test("builds labeled account routes", () => {
    expect(getAccountNavItems()).toEqual([
      { path: "settings", label: "Account", href: "/account/settings" },
      { path: "security", label: "Security", href: "/account/security" },
    ]);
  });
});
