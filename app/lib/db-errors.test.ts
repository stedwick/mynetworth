import { describe, expect, it } from "bun:test";

import { isUniqueConstraintViolation } from "./db-errors";

describe("isUniqueConstraintViolation", () => {
  it("matches errors that include the constraint name", () => {
    const error = new Error(
      'duplicate key value violates unique constraint "categories_user_id_name_unique"',
    );

    expect(
      isUniqueConstraintViolation(error, "categories_user_id_name_unique"),
    ).toBe(true);
  });

  it("returns false when the constraint name is missing", () => {
    const error = new Error("duplicate key value violates unique constraint");

    expect(
      isUniqueConstraintViolation(error, "categories_user_id_name_unique"),
    ).toBe(false);
  });
});
