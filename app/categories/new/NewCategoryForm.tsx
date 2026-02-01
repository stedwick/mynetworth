"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import CategoryEditForm from "@/app/components/organisms/CategoryEditForm";
import CategoryEditPageTemplate from "@/app/components/templates/CategoryEditPageTemplate";
import {
  categoryEditDefaultValues,
  categoryFormSchema,
  type CategoryEditFormValues,
} from "@/app/lib/category-form";
import { createCategory } from "./actions";

export default function NewCategoryForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { control, handleSubmit, formState } = useForm<CategoryEditFormValues>({
    defaultValues: categoryEditDefaultValues,
    mode: "onBlur",
    resolver: zodResolver(categoryFormSchema),
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createCategory(values);
      if (result?.error) {
        setFormError(result.error);
      }
    });
  });

  return (
    <CategoryEditPageTemplate
      title="New category"
      description="Add a category to keep assets organized."
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
          />
        </div>
      }
    />
  );
}
