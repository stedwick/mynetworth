import { describe, expect, it } from "bun:test";

import { compareStringsCaseInsensitive } from "./string-utils";

describe("compareStringsCaseInsensitive", () => {
  it("sorts strings without case sensitivity", () => {
    const items = ["banana", "Apple", "cherry"];
    const result = [...items].sort(compareStringsCaseInsensitive);

    expect(result).toEqual(["Apple", "banana", "cherry"]);
  });
});
