"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { refreshAssetPrices } from "@/app/me/actions";

export default function RouteRefreshTrigger() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname !== "/me") {
      lastPath.current = pathname;
      return;
    }

    if (lastPath.current === "/me") {
      return;
    }

    lastPath.current = pathname;

    const run = async () => {
      await refreshAssetPrices(new FormData());
    };

    void run();
  }, [pathname]);

  return null;
}
