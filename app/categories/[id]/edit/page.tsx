import { redirect } from "next/navigation";

import EditCategoryForm from "@/app/categories/[id]/edit/EditCategoryForm";
import { categoryFormValuesFromRecord } from "@/app/lib/category-form";
import { getCategoryForUser } from "@/app/lib/services/categories.service";
import { authServer } from "@/lib/auth/server";

export default async function CategoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await authServer.getSession();

  if (!data?.user) {
    redirect("/auth/sign-in");
  }

  const category = await getCategoryForUser(data.user.id, id);

  if (!category) {
    redirect("/me");
  }

  const initialValues = categoryFormValuesFromRecord(category);

  return <EditCategoryForm categoryId={id} initialValues={initialValues} />;
}
