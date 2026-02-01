"use client";

import Image from "next/image";
import { useFormStatus } from "react-dom";

export default function RefreshButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="app-button asset-refresh-button w-full gap-2 sm:w-auto"
      disabled={pending}
      aria-disabled={pending}
    >
      <Image
        src="/icons8/refresh.png"
        alt=""
        aria-hidden="true"
        className="icon-light-dark h-4 w-4"
        width={16}
        height={16}
        loading="lazy"
      />
      {pending ? "Refreshing..." : "Refresh prices"}
    </button>
  );
}
