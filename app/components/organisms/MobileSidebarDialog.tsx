"use client";

import type { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import Image from "next/image";

export default function MobileSidebarDialog({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full md:hidden">
      <Dialog.Root>
        <Dialog.Trigger
          className="flex w-full items-center justify-start gap-3 rounded-none bg-[var(--neon-secondary)] px-4 py-3 text-sm font-semibold text-[var(--neon-secondary-foreground)] shadow-sm transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
          aria-label={`${title} menu`}
        >
          <Image
            src="/icons8/menu.png"
            alt=""
            aria-hidden="true"
            className="h-5 w-5 dark:invert"
            width={20}
            height={20}
            loading="lazy"
          />
          <span className="uppercase tracking-[0.2em]">{title}</span>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 min-h-dvh bg-slate-950/45 transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0 supports-[-webkit-touch-callout:none]:absolute" />
          <Dialog.Popup className="fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] translate-x-0 transition-[transform,opacity] duration-200 data-starting-style:-translate-x-full data-starting-style:opacity-30 data-ending-style:-translate-x-full data-ending-style:opacity-30">
            <div className="m-3 flex h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-300/30 bg-white/95 backdrop-blur-xl shadow-[24px_0_45px_rgba(15,23,42,0.2)] dark:border-slate-400/25 dark:bg-slate-900/90 dark:shadow-[24px_0_45px_rgba(0,0,0,0.45)]">
              <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800 dark:text-white/90">
                <Dialog.Title className="uppercase tracking-[0.2em] text-slate-600 dark:text-white/60">
                  {title}
                </Dialog.Title>
                <Dialog.Close
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200/70 text-slate-600 transition hover:bg-slate-100 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10"
                  aria-label="Close menu"
                >
                  <Image
                    src="/icons8/close.png"
                    alt=""
                    aria-hidden="true"
                    className="h-5 w-5 opacity-70 dark:invert dark:opacity-85"
                    width={20}
                    height={20}
                    loading="lazy"
                  />
                </Dialog.Close>
              </div>
              <div className="flex-1 overflow-y-auto p-4">{children}</div>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
