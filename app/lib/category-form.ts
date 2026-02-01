import { z } from "zod";
import type { Selectable } from "kysely";

import type { DB } from "@/app/lib/db-types";
import { parseNumericString, toNumericString } from "@/app/lib/number-utils";

export type CategoryEditFormValues = {
  name: string;
  order: string;
};

export type NormalizedCategoryFormValues = {
  name: string;
  sortOrder: number;
};

export type CategoryFormRecord = Selectable<DB["categories"]>;

const requiredString = (message: string) =>
  z.string().trim().min(1, { message });

const numericString = (message: string) =>
  requiredString(message).refine((value) => Number.isFinite(Number(value)), {
    message,
  });

export const categoryFormSchema = z.object({
  name: requiredString("Category name is required."),
  order: numericString("Sort order must be a number."),
});

export const normalizeCategoryFormValues = (
  values: CategoryEditFormValues,
): NormalizedCategoryFormValues => {
  const parsed = categoryFormSchema.parse(values);

  return {
    name: parsed.name.trim(),
    sortOrder: parseNumericString(parsed.order),
  };
};

export const categoryFormValuesFromRecord = (
  record: CategoryFormRecord,
): CategoryEditFormValues => {
  return {
    name: record.name?.trim() ?? "",
    order: toNumericString(record.sort_order, "1"),
  };
};

export const categoryEditDefaultValues: CategoryEditFormValues = {
  name: "",
  order: "1",
};
