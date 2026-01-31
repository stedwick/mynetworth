"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import CategoryEditForm from "@/app/components/organisms/CategoryEditForm";
import CategoryEditPageTemplate from "@/app/components/templates/CategoryEditPageTemplate";
import {
  categoryEditDefaultValues,
  type CategoryEditFormValues,
} from "@/app/lib/category-form";

export default function CategoryEditPage() {
  const router = useRouter();
  const { control, handleSubmit, formState } = useForm<CategoryEditFormValues>({
    defaultValues: categoryEditDefaultValues,
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(() => {});

  return (
    <CategoryEditPageTemplate
      title="Edit category"
      description="Update the category name and order."
      form={
        <CategoryEditForm
          control={control}
          onSubmit={onSubmit}
          submitting={formState.isSubmitting}
          submitCount={formState.submitCount}
          onBack={() => router.back()}
          showDelete
        />
      }
    />
  );
}
