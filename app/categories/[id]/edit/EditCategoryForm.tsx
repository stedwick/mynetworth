"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import CategoryEditForm from "@/app/components/organisms/CategoryEditForm";
import CategoryEditPageTemplate from "@/app/components/templates/CategoryEditPageTemplate";
import {
  categoryFormSchema,
  type CategoryEditFormValues,
} from "@/app/lib/category-form";
import { deleteCategory, updateCategory } from "./actions";

export default function EditCategoryForm({
  categoryId,
  initialValues,
}: {
  categoryId: string;
  initialValues: CategoryEditFormValues;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { control, handleSubmit, formState } = useForm<CategoryEditFormValues>({
    defaultValues: initialValues,
    mode: "onBlur",
    resolver: zodResolver(categoryFormSchema),
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await updateCategory(categoryId, values);
      if (result?.error) {
        setFormError(result.error);
      }
    });
  });

  const handleDelete = () => {
    setFormError(null);
    startTransition(async () => {
      const result = await deleteCategory(categoryId);
      if (result?.error) {
        setFormError(result.error);
      }
    });
  };

  return (
    <CategoryEditPageTemplate
      title="Edit category"
      description="Update the category name and order."
      form={
        <div className="space-y-4">
          {formError ? (
            <div className="rounded-lg border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}
          <CategoryEditForm
            control={control}
            onSubmit={onSubmit}
            submitting={formState.isSubmitting || isPending}
            submitCount={formState.submitCount}
            onBack={() => router.back()}
            showDelete
            onDelete={handleDelete}
          />
        </div>
      }
    />
  );
}
