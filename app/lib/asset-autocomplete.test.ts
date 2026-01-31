import { describe, expect, it } from "bun:test";
import { shouldRunAutocomplete } from "./asset-autocomplete";

describe("shouldRunAutocomplete", () => {
  it("requires the minimum query length", () => {
    expect(shouldRunAutocomplete("a", 2)).toBe(false);
    expect(shouldRunAutocomplete("ab", 2)).toBe(true);
    expect(shouldRunAutocomplete("  ab  ", 2)).toBe(true);
  });
});
