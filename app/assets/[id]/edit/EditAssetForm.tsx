"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import AssetEditForm from "@/app/components/organisms/AssetEditForm";
import AssetEditPageTemplate from "@/app/components/templates/AssetEditPageTemplate";
import {
  assetFormSchema,
  type AssetEditFormValues,
} from "@/app/lib/asset-form";
import { deleteAsset, updateAsset } from "./actions";

export default function EditAssetForm({
  assetId,
  categoryNames,
  initialValues,
}: {
  assetId: string;
  categoryNames: string[];
  initialValues: AssetEditFormValues;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { control, handleSubmit, formState, setValue } =
    useForm<AssetEditFormValues>({
      defaultValues: {
        ...initialValues,
        category: initialValues.category || categoryNames[0] || "",
      },
      mode: "onBlur",
      resolver: zodResolver(assetFormSchema),
    });

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await updateAsset(assetId, values);
      if (result?.error) {
        setFormError(result.error);
      }
    });
  });

  const handleDelete = () => {
    setFormError(null);
    startTransition(async () => {
      const result = await deleteAsset(assetId);
      if (result?.error) {
        setFormError(result.error);
      }
    });
  };

  return (
    <AssetEditPageTemplate
      title="Edit asset"
      description="Update asset details and keep your net worth snapshots accurate."
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
            showDelete
            onDelete={handleDelete}
            categoryNames={categoryNames}
          />
        </div>
      }
    />
  );
}
