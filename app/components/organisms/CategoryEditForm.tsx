"use client";

import { type FormEventHandler } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { Field } from "@base-ui/react/field";
import { Controller, type Control } from "react-hook-form";

import type { CategoryEditFormValues } from "@/app/lib/category-form";

const fieldRootClassName = "flex flex-col gap-2";
const fieldLabelClassName =
  "text-sm font-medium text-slate-700 dark:text-white/70";
const fieldControlClassName =
  "h-11 w-full rounded-lg border border-slate-200/80 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-slate-900/40 disabled:cursor-not-allowed disabled:border-slate-200/60 disabled:bg-slate-100/80 disabled:text-slate-400 dark:border-white/10 dark:bg-neutral-900/40 dark:text-white/90 dark:focus:outline-white/30 dark:disabled:border-white/10 dark:disabled:bg-white/5 dark:disabled:text-white/40";
const fieldErrorClassName = "text-xs text-rose-600 dark:text-rose-400";

export default function CategoryEditForm({
  control,
  onSubmit,
  submitting,
  submitCount,
  onBack,
  showDelete = false,
  onDelete,
}: {
  control: Control<CategoryEditFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitting: boolean;
  submitCount: number;
  onBack: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
}) {
  const showAllErrors = submitCount > 0;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
        All fields are required
      </p>
      <div className="space-y-6">
        <Controller
          name="name"
          control={control}
          rules={{ required: "Category name is required." }}
          render={({ field, fieldState }) => (
            <Field.Root
              name={field.name}
              invalid={fieldState.invalid}
              touched={fieldState.isTouched || showAllErrors}
              dirty={fieldState.isDirty}
              className={fieldRootClassName}
            >
              <Field.Label className={fieldLabelClassName}>
                Category name
              </Field.Label>
              <Field.Control
                ref={field.ref}
                className={fieldControlClassName}
                placeholder="e.g. Alternatives"
                required
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
              />
              <Field.Error
                match={
                  (fieldState.isTouched || showAllErrors) && !!fieldState.error
                }
                className={fieldErrorClassName}
              >
                {fieldState.error?.message}
              </Field.Error>
            </Field.Root>
          )}
        />

        <Controller
          name="order"
          control={control}
          rules={{ required: "Sort order is required." }}
          render={({ field, fieldState }) => (
            <Field.Root
              name={field.name}
              invalid={fieldState.invalid}
              touched={fieldState.isTouched || showAllErrors}
              dirty={fieldState.isDirty}
              className={fieldRootClassName}
            >
              <Field.Label className={fieldLabelClassName}>
                Sort order
              </Field.Label>
              <Field.Control
                ref={field.ref}
                className={fieldControlClassName}
                placeholder="e.g. 1"
                required
                type="number"
                inputMode="numeric"
                step="1"
                value={field.value}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
              />
              <p className="text-xs text-slate-500 dark:text-white/50">
                Lower numbers appear first.
              </p>
              <Field.Error
                match={
                  (fieldState.isTouched || showAllErrors) && !!fieldState.error
                }
                className={fieldErrorClassName}
              >
                {fieldState.error?.message}
              </Field.Error>
            </Field.Root>
          )}
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onBack}
            className="app-button app-button-cancel w-full sm:w-auto"
          >
            <Image
              src="/icons8/arrow-left.png"
              alt=""
              aria-hidden="true"
              className="icon-light-dark h-4 w-4"
              width={16}
              height={16}
              loading="lazy"
            />
            Go back
          </button>
          {showDelete ? (
            <Dialog.Root>
              <Dialog.Trigger
                className="app-button app-button-danger w-full sm:w-auto"
                type="button"
              >
                <Image
                  src="/icons8/trash.png"
                  alt=""
                  aria-hidden="true"
                  className="icon-light-dark-strong h-4 w-4"
                  width={16}
                  height={16}
                  loading="lazy"
                />
                Delete category
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-slate-950/45 transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0" />
                <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(26rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
                  <div className="space-y-3">
                    <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                      Delete category?
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-slate-600 dark:text-white/70">
                      This action cannot be undone. The category and its assets
                      will be removed.
                    </Dialog.Description>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <Dialog.Close className="app-button app-button-cancel w-full sm:w-auto">
                      <Image
                        src="/icons8/check.png"
                        alt=""
                        aria-hidden="true"
                        className="icon-light-dark h-4 w-4"
                        width={16}
                        height={16}
                        loading="lazy"
                      />
                      Keep category
                    </Dialog.Close>
                    <Dialog.Close
                      className="app-button app-button-danger w-full sm:w-auto"
                      onClick={() => onDelete?.()}
                    >
                      <Image
                        src="/icons8/trash.png"
                        alt=""
                        aria-hidden="true"
                        className="icon-light-dark-strong h-4 w-4"
                        width={16}
                        height={16}
                        loading="lazy"
                      />
                      Delete category
                    </Dialog.Close>
                  </div>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          ) : null}
        </div>
        <button
          type="submit"
          className="app-button app-button-primary w-full sm:w-auto"
          disabled={submitting}
        >
          <Image
            src="/icons8/check.png"
            alt=""
            aria-hidden="true"
            className="icon-on-primary h-4 w-4"
            width={16}
            height={16}
            loading="lazy"
          />
          Save category
        </button>
      </div>
    </form>
  );
}
