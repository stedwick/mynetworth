"use client";

import type { FormEventHandler } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@base-ui/react/button";
import { Dialog } from "@base-ui/react/dialog";
import { Field } from "@base-ui/react/field";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { Select } from "@base-ui/react/select";
import { Controller, type Control, useWatch } from "react-hook-form";

import type { AssetEditFormValues } from "@/app/lib/asset-form";

const fieldRootClassName = "flex flex-col gap-2";
const fieldLabelClassName =
  "text-sm font-medium text-slate-700 dark:text-white/70";
const fieldControlClassName =
  "h-11 w-full rounded-lg border border-slate-200/80 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-slate-900/40 disabled:cursor-not-allowed disabled:border-slate-200/60 disabled:bg-slate-100/80 disabled:text-slate-400 dark:border-white/10 dark:bg-neutral-900/40 dark:text-white/90 dark:focus:outline-white/30 dark:disabled:border-white/10 dark:disabled:bg-white/5 dark:disabled:text-white/40";
const fieldErrorClassName = "text-xs text-rose-600 dark:text-rose-400";
const selectTriggerClassName =
  "flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-white px-3 text-sm text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-slate-900/40 data-[popup-open]:border-slate-300 data-[popup-open]:bg-slate-50 dark:border-white/10 dark:bg-neutral-900/40 dark:text-white/90 dark:hover:bg-white/10 dark:data-[popup-open]:bg-white/10";
const selectPopupClassName =
  "min-w-[var(--anchor-width)] rounded-xl border border-slate-200/70 bg-white/95 p-1 text-sm text-slate-900 shadow-lg outline-none dark:border-white/10 dark:bg-neutral-950/95 dark:text-white";
const selectItemClassName =
  "grid cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 rounded-lg px-3 py-2 outline-none transition data-[highlighted]:bg-slate-900 data-[highlighted]:text-white dark:data-[highlighted]:bg-white dark:data-[highlighted]:text-slate-900";
const radioRootClassName =
  "flex size-4 items-center justify-center rounded-full border border-slate-300 transition data-[checked]:border-slate-900 data-[checked]:bg-slate-900 data-[unchecked]:bg-white dark:border-white/30 dark:data-[checked]:border-white dark:data-[checked]:bg-white dark:data-[unchecked]:bg-transparent";
const radioIndicatorClassName =
  "flex before:size-2 before:rounded-full before:bg-white dark:before:bg-slate-900 data-[unchecked]:hidden";
const radioOptionClassName =
  "flex items-center gap-2 rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white";

const categoryOptions = [
  { value: "stocks", label: "Stocks" },
  { value: "crypto", label: "Crypto" },
  { value: "properties", label: "Properties" },
  { value: "retirement", label: "Retirement" },
  { value: "cash", label: "Cash" },
];

const kindOptions = [
  { value: "stock", label: "Stock" },
  { value: "crypto", label: "Crypto" },
  { value: "wallet", label: "Crypto Wallet" },
  { value: "manual", label: "Manual" },
];

export default function AssetEditForm({
  control,
  onSubmit,
  submitting,
  submitCount,
  showDelete = false,
  onDelete,
}: {
  control: Control<AssetEditFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitting: boolean;
  submitCount: number;
  showDelete?: boolean;
  onDelete?: () => void;
}) {
  const router = useRouter();
  const selectedKind = useWatch({ control, name: "kind" });
  const isManualKind = selectedKind === "manual";
  const isWalletKind = selectedKind === "wallet";
  const showAllErrors = submitCount > 0;
  const symbolPlaceholder =
    selectedKind === "wallet"
      ? "LEDGER"
      : selectedKind === "manual"
        ? "HOUSE"
        : selectedKind === "crypto"
          ? "BTC"
          : "AAPL";
  const namePlaceholder =
    selectedKind === "wallet"
      ? "Safe deposit box"
      : selectedKind === "manual"
        ? "Mortgage"
        : selectedKind === "crypto"
          ? "Bitcoin"
          : "Apple";

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
        All fields are required
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <Controller
          name="kind"
          control={control}
          rules={{ required: "Asset type is required." }}
          render={({ field, fieldState }) => (
            <Field.Root
              name={field.name}
              invalid={fieldState.invalid}
              touched={fieldState.isTouched || showAllErrors}
              dirty={fieldState.isDirty}
              className={`${fieldRootClassName} sm:col-span-2`}
            >
              <Field.Label className={fieldLabelClassName}>
                Asset type
              </Field.Label>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid gap-2 sm:grid-cols-2"
              >
                {kindOptions.map((option) => (
                  <label key={option.value} className={radioOptionClassName}>
                    <Radio.Root
                      value={option.value}
                      className={radioRootClassName}
                    >
                      <Radio.Indicator className={radioIndicatorClassName} />
                    </Radio.Root>
                    <span>{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
              <p className="text-xs text-slate-500 dark:text-white/50">
                Examples: Stock (AAPL, TSLA) · Crypto (BTC, ETH) · Crypto Wallet
                (Bitcoin, Ethereum & EMV, Solana addresses) · Manual (Mortgage,
                Auto Loan)
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

        {selectedKind ? (
          <>
            {isWalletKind ? (
              <Controller
                name="walletAddress"
                control={control}
                rules={
                  isWalletKind
                    ? { required: "Wallet address is required." }
                    : undefined
                }
                render={({ field, fieldState }) => (
                  <Field.Root
                    name={field.name}
                    invalid={fieldState.invalid}
                    touched={fieldState.isTouched || showAllErrors}
                    dirty={fieldState.isDirty}
                    className={`${fieldRootClassName} sm:col-span-2`}
                  >
                    <Field.Label className={fieldLabelClassName}>
                      Wallet address
                    </Field.Label>
                    <Field.Control
                      ref={field.ref}
                      className={fieldControlClassName}
                      placeholder="e.g. bc1q..."
                      required={isWalletKind}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                    <Field.Error
                      match={
                        (fieldState.isTouched || showAllErrors) &&
                        !!fieldState.error
                      }
                      className={fieldErrorClassName}
                    >
                      {fieldState.error?.message}
                    </Field.Error>
                  </Field.Root>
                )}
              />
            ) : null}

            <Controller
              name="ticker"
              control={control}
              rules={{ required: "Ticker symbol is required." }}
              render={({ field, fieldState }) => (
                <Field.Root
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched || showAllErrors}
                  dirty={fieldState.isDirty}
                  className={fieldRootClassName}
                >
                  <Field.Label className={fieldLabelClassName}>
                    Ticker Symbol
                  </Field.Label>
                  <Field.Control
                    ref={field.ref}
                    className={fieldControlClassName}
                    placeholder={`e.g. ${symbolPlaceholder}`}
                    required
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  {isWalletKind || isManualKind ? (
                    <p className="text-xs text-slate-500 dark:text-white/50">
                      Choose any symbol and name you want to be displayed.
                    </p>
                  ) : null}
                  <Field.Error
                    match={
                      (fieldState.isTouched || showAllErrors) &&
                      !!fieldState.error
                    }
                    className={fieldErrorClassName}
                  >
                    {fieldState.error?.message}
                  </Field.Error>
                </Field.Root>
              )}
            />

            <Controller
              name="name"
              control={control}
              rules={{ required: "Asset name is required." }}
              render={({ field, fieldState }) => (
                <Field.Root
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched || showAllErrors}
                  dirty={fieldState.isDirty}
                  className={fieldRootClassName}
                >
                  <Field.Label className={fieldLabelClassName}>
                    Asset name
                  </Field.Label>
                  <Field.Control
                    ref={field.ref}
                    className={fieldControlClassName}
                    placeholder={`e.g. ${namePlaceholder}`}
                    required
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                  <Field.Error
                    match={
                      (fieldState.isTouched || showAllErrors) &&
                      !!fieldState.error
                    }
                    className={fieldErrorClassName}
                  >
                    {fieldState.error?.message}
                  </Field.Error>
                </Field.Root>
              )}
            />

            {isWalletKind ? null : (
              <>
                <Controller
                  name="quantity"
                  control={control}
                  rules={{ required: "Quantity is required." }}
                  render={({ field, fieldState }) => (
                    <Field.Root
                      name={field.name}
                      invalid={fieldState.invalid}
                      touched={fieldState.isTouched || showAllErrors}
                      dirty={fieldState.isDirty}
                      className={fieldRootClassName}
                    >
                      <Field.Label className={fieldLabelClassName}>
                        Quantity
                      </Field.Label>
                      <Field.Control
                        ref={field.ref}
                        className={fieldControlClassName}
                        placeholder="e.g. 32"
                        required
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                      <Field.Error
                        match={
                          (fieldState.isTouched || showAllErrors) &&
                          !!fieldState.error
                        }
                        className={fieldErrorClassName}
                      >
                        {fieldState.error?.message}
                      </Field.Error>
                    </Field.Root>
                  )}
                />

                <Controller
                  name="price"
                  control={control}
                  rules={
                    isManualKind
                      ? { required: "Price is required." }
                      : undefined
                  }
                  render={({ field, fieldState }) => (
                    <Field.Root
                      name={field.name}
                      invalid={fieldState.invalid}
                      touched={fieldState.isTouched || showAllErrors}
                      dirty={fieldState.isDirty}
                      className={fieldRootClassName}
                    >
                      <Field.Label className={fieldLabelClassName}>
                        Price
                      </Field.Label>
                      <Field.Control
                        ref={field.ref}
                        className={fieldControlClassName}
                        placeholder="e.g. 185.32"
                        required={isManualKind}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={field.value}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={!isManualKind}
                      />
                      {isManualKind ? (
                        <p className="text-xs text-slate-500 dark:text-white/50">
                          Negative prices can represent debt.
                        </p>
                      ) : null}
                      <Field.Error
                        match={
                          (fieldState.isTouched || showAllErrors) &&
                          !!fieldState.error
                        }
                        className={fieldErrorClassName}
                      >
                        {fieldState.error?.message}
                      </Field.Error>
                    </Field.Root>
                  )}
                />
              </>
            )}

            <Controller
              name="category"
              control={control}
              rules={{ required: "Category is required." }}
              render={({ field, fieldState }) => (
                <Field.Root
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched || showAllErrors}
                  dirty={fieldState.isDirty}
                  className={fieldRootClassName}
                >
                  <Field.Label className={fieldLabelClassName}>
                    Category
                  </Field.Label>
                  <Select.Root
                    items={categoryOptions}
                    value={field.value || null}
                    onValueChange={(nextValue) =>
                      field.onChange(nextValue ?? "")
                    }
                  >
                    <Select.Trigger className={selectTriggerClassName}>
                      <Select.Value>
                        {(value) => {
                          const current =
                            categoryOptions.find(
                              (option) => option.value === value,
                            )?.label ?? "Select category";
                          return (
                            <span
                              className={
                                value
                                  ? "text-slate-900 dark:text-white"
                                  : "text-slate-400 dark:text-white/40"
                              }
                            >
                              {current}
                            </span>
                          );
                        }}
                      </Select.Value>
                      <Select.Icon className="text-slate-400 dark:text-white/40">
                        <span aria-hidden="true">▾</span>
                      </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                      <Select.Positioner sideOffset={8} className="z-50">
                        <Select.Popup className={selectPopupClassName}>
                          <Select.List className="max-h-64 overflow-y-auto py-1">
                            {categoryOptions.map((option) => (
                              <Select.Item
                                key={option.value}
                                value={option.value}
                                className={selectItemClassName}
                              >
                                <Select.ItemIndicator className="text-xs">
                                  ✓
                                </Select.ItemIndicator>
                                <Select.ItemText>
                                  {option.label}
                                </Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.List>
                        </Select.Popup>
                      </Select.Positioner>
                    </Select.Portal>
                  </Select.Root>
                  <Field.Error
                    match={
                      (fieldState.isTouched || showAllErrors) &&
                      !!fieldState.error
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
              rules={{ required: "Order is required." }}
              render={({ field, fieldState }) => (
                <Field.Root
                  name={field.name}
                  invalid={fieldState.invalid}
                  touched={fieldState.isTouched || showAllErrors}
                  dirty={fieldState.isDirty}
                  className={fieldRootClassName}
                >
                  <Field.Label className={fieldLabelClassName}>
                    Order
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
                  <Field.Error
                    match={
                      (fieldState.isTouched || showAllErrors) &&
                      !!fieldState.error
                    }
                    className={fieldErrorClassName}
                  >
                    {fieldState.error?.message}
                  </Field.Error>
                </Field.Root>
              )}
            />
          </>
        ) : null}
      </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={() => router.back()}
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
            </Button>
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
                  Delete asset
                </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-40 bg-slate-950/45 transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0" />
                <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(26rem,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-950/95">
                  <div className="space-y-3">
                    <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-white">
                      Delete asset?
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-slate-600 dark:text-white/70">
                      This action cannot be undone. The asset will be removed
                      from your portfolio.
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
                      Keep asset
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
                      Delete asset
                    </Dialog.Close>
                  </div>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          ) : null}
        </div>
        <Button
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
          Save asset
        </Button>
      </div>
    </form>
  );
}
