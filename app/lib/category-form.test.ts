import { describe, expect, it } from "bun:test";

import {
  categoryFormValuesFromRecord,
  normalizeCategoryFormValues,
  type CategoryFormRecord,
} from "./category-form";

describe("normalizeCategoryFormValues", () => {
  it("trims and parses values", () => {
    const result = normalizeCategoryFormValues({
      name: "  Alternatives ",
      order: "2",
    });

    expect(result.name).toBe("Alternatives");
    expect(result.sortOrder).toBe(2);
  });
});

describe("categoryFormValuesFromRecord", () => {
  it("maps database values into form defaults", () => {
    const now = new Date("2025-01-02T00:00:00Z");
    const record: CategoryFormRecord = {
      id: "category-1",
      user_id: "user-1",
      name: " Retirement ",
      sort_order: 3,
      created_at: now,
      updated_at: now,
    };

    const result = categoryFormValuesFromRecord(record);

    expect(result.name).toBe("Retirement");
    expect(result.order).toBe("3");
  });

  it("falls back when values are missing or invalid", () => {
    const now = new Date("2025-01-02T00:00:00Z");
    const record: CategoryFormRecord = {
      id: "category-2",
      user_id: "user-2",
      name: "",
      sort_order: Number.NaN,
      created_at: now,
      updated_at: now,
    };

    const result = categoryFormValuesFromRecord(record);

    expect(result.name).toBe("");
    expect(result.order).toBe("1");
  });
});
