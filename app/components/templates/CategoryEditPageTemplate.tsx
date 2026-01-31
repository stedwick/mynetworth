import type { ReactNode } from "react";

export default function CategoryEditPageTemplate({
  title,
  description,
  form,
}: {
  title: string;
  description: string;
  form: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-white/50">
          Category editor
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-slate-500 dark:text-white/60">
          {description}
        </p>
      </header>
      {form}
    </div>
  );
}
