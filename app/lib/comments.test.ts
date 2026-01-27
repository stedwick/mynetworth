import { describe, expect, test } from "bun:test";

import { normalizeComment } from "./comments";

describe("normalizeComment", () => {
  test("trims whitespace", () => {
    expect(normalizeComment("  hello  ")).toBe("hello");
  });
});
