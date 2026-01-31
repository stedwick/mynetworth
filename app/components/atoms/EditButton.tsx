import Image from "next/image";
import Link from "next/link";
import { Button } from "@base-ui/react/button";

export default function EditButton({
  label,
  href,
}: {
  label: string;
  href?: string;
}) {
  const className =
    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200/70 text-slate-500 opacity-0 transition hover:bg-slate-100 hover:text-slate-700 group-hover:opacity-100 focus-visible:opacity-100 dark:border-white/10 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white";
  const render = href ? <Link href={href} /> : undefined;

  return (
    <Button
      type="button"
      render={render}
      nativeButton={href ? false : undefined}
      className={className}
      aria-label={label}
      title="Edit"
    >
      <Image
        src="/icons8/edit.png"
        alt=""
        aria-hidden="true"
        className="h-4 w-4 opacity-80 dark:invert"
        width={16}
        height={16}
        loading="lazy"
      />
    </Button>
  );
}
