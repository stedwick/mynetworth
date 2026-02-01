"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AssetEditForm from "@/app/components/organisms/AssetEditForm";
import AssetEditPageTemplate from "@/app/components/templates/AssetEditPageTemplate";
import {
  assetEditDefaultValues,
  assetFormSchema,
  type AssetEditFormValues,
} from "@/app/lib/asset-form";
import { createAsset } from "./actions";

export default function NewAssetForm({
  categoryNames,
}: {
  categoryNames: string[];
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { control, handleSubmit, formState, setValue } =
    useForm<AssetEditFormValues>({
      defaultValues: {
        ...assetEditDefaultValues,
        category: categoryNames[0] ?? assetEditDefaultValues.category,
      },
      mode: "onBlur",
      resolver: zodResolver(assetFormSchema),
    });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await createAsset(values);
      if (result?.error) {
        setFormError(result.error);
      }
    });
  });

  return (
    <AssetEditPageTemplate
      title="New asset"
      description="Add a new asset to your portfolio."
      form={
        <div className="space-y-4">
          {formError ? (
            <div className="rounded-lg border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          ) : null}
          <AssetEditForm
            control={control}
            setValue={setValue}
            onSubmit={onSubmit}
            submitting={formState.isSubmitting || isPending}
            submitCount={formState.submitCount}
            categoryNames={categoryNames}
          />
        </div>
      }
    />
  );
}
