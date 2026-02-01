"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  categoryFormSchema,
  normalizeCategoryFormValues,
  type CategoryEditFormValues,
} from "@/app/lib/category-form";
import { isUniqueConstraintViolation } from "@/app/lib/db-errors";
import { createCategoryForUser } from "@/app/lib/services/categories.service";
import { authServer } from "@/lib/auth/server";

export type CreateCategoryResult = { error?: string };

export async function createCategory(
  values: CategoryEditFormValues,
): Promise<CreateCategoryResult> {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    return { error: "You must be signed in to create a category." };
  }

  const parsed = categoryFormSchema.safeParse(values);

  if (!parsed.success) {
    return { error: "Please check the form for errors." };
  }

  const normalized = normalizeCategoryFormValues(parsed.data);

  try {
    await createCategoryForUser(data.user.id, normalized);
  } catch (error) {
    if (isUniqueConstraintViolation(error, "categories_user_id_name_unique")) {
      return { error: "Category name already exists." };
    }
    throw error;
  }

  revalidatePath("/me");
  redirect("/me");
}
