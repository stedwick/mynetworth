"use client";

import { useForm } from "react-hook-form";

import AssetEditForm from "@/app/components/organisms/AssetEditForm";
import AssetEditPageTemplate from "@/app/components/templates/AssetEditPageTemplate";
import {
  assetEditDefaultValues,
  type AssetEditFormValues,
} from "@/app/lib/asset-form";

export default function NewAssetPage() {
  const { control, handleSubmit, formState } = useForm<AssetEditFormValues>({
    defaultValues: assetEditDefaultValues,
    mode: "onBlur",
  });

  const onSubmit = handleSubmit(() => {});

  return (
    <AssetEditPageTemplate
      title="New asset"
      description="Add a new asset to your portfolio."
      form={
        <AssetEditForm
          control={control}
          onSubmit={onSubmit}
          submitting={formState.isSubmitting}
          submitCount={formState.submitCount}
        />
      }
    />
  );
}
