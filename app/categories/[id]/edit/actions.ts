"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  categoryFormSchema,
  normalizeCategoryFormValues,
  type CategoryEditFormValues,
} from "@/app/lib/category-form";
import { isUniqueConstraintViolation } from "@/app/lib/db-errors";
import {
  countAssetsForCategory,
  deleteCategoryForUser,
  getCategoryForUser,
  updateCategoryForUser,
} from "@/app/lib/services/categories.service";
import { authServer } from "@/lib/auth/server";

export type UpdateCategoryResult = { error?: string };

export async function updateCategory(
  categoryId: string,
  values: CategoryEditFormValues,
): Promise<UpdateCategoryResult> {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    return { error: "You must be signed in to update a category." };
  }

  const parsed = categoryFormSchema.safeParse(values);

  if (!parsed.success) {
    return { error: "Please check the form for errors." };
  }

  const existing = await getCategoryForUser(data.user.id, categoryId);

  if (!existing) {
    return { error: "Category not found." };
  }

  const normalized = normalizeCategoryFormValues(parsed.data);

  try {
    await updateCategoryForUser(data.user.id, categoryId, normalized);
  } catch (error) {
    if (
      isUniqueConstraintViolation(error, "categories_user_id_name_unique")
    ) {
      return { error: "Category name already exists." };
    }
    throw error;
  }

  revalidatePath("/me");
  redirect("/me");
}

export async function deleteCategory(
  categoryId: string,
): Promise<UpdateCategoryResult> {
  const { data } = await authServer.getSession();

  if (!data?.user) {
    return { error: "You must be signed in to delete a category." };
  }

  const assetCount = await countAssetsForCategory(data.user.id, categoryId);

  if (assetCount > 0) {
    return { error: "Cannot delete a category that has assets." };
  }

  await deleteCategoryForUser(data.user.id, categoryId);

  revalidatePath("/me");
  redirect("/me");
}
