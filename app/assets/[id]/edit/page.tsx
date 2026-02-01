"use client";

import { useForm } from "react-hook-form";

import AssetEditForm from "@/app/components/organisms/AssetEditForm";
import AssetEditPageTemplate from "@/app/components/templates/AssetEditPageTemplate";
import {
  assetEditDefaultValues,
  type AssetEditFormValues,
} from "@/app/lib/asset-form";

export default function AssetEditPage() {
  const categoryNames: string[] = [];
  const { control, handleSubmit, formState, setValue } =
    useForm<AssetEditFormValues>({
      defaultValues: assetEditDefaultValues,
      mode: "onBlur",
    });

  const onSubmit = handleSubmit(() => {});

  return (
    <AssetEditPageTemplate
      title="Edit asset"
      description="Update asset details and keep your net worth snapshots accurate."
      form={
        <AssetEditForm
          control={control}
          setValue={setValue}
          onSubmit={onSubmit}
          submitting={formState.isSubmitting}
          submitCount={formState.submitCount}
          showDelete
          categoryNames={categoryNames}
        />
      }
    />
  );
}
