import "server-only";

import Link from "next/link";

import { authServer } from "@/lib/auth/server";

export default async function DemoBanner() {
  const { data } = await authServer.getSession();
  const isLoggedIn = Boolean(data?.user);
  const href = isLoggedIn ? "/me" : "/auth/sign-up";
  const label = isLoggedIn ? "View my portfolio" : "Create account";
  const message = isLoggedIn
    ? "This is a demo portfolio."
    : "This is a demo portfolio. Assets & prices are made up. Sign up to see your real net worth.";

  return (
    <div className="mb-6 rounded-2xl border border-amber-200/70 bg-linear-to-r from-amber-200 via-amber-100 to-yellow-50 p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Demo Mode
          </p>
          <p className="text-base font-semibold text-amber-950">{message}</p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
        >
          {label}
        </Link>
      </div>
    </div>
  );
}
