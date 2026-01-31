"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export default function ScrollableTableContainer({
  children,
  onScrollHintChange,
}: {
  children: ReactNode;
  onScrollHintChange?: (showHint: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);
  const showHintRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const update = () => {
      const isScrollable = container.scrollWidth > container.clientWidth + 1;
      const atEnd =
        Math.ceil(container.scrollLeft + container.clientWidth) >=
        container.scrollWidth - 1;
      const nextShowHint = isScrollable && !atEnd;
      setShowHint(nextShowHint);
      if (showHintRef.current !== nextShowHint) {
        showHintRef.current = nextShowHint;
        onScrollHintChange?.(nextShowHint);
      }
    };

    update();

    const handleScroll = () => update();
    container.addEventListener("scroll", handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [onScrollHintChange]);

  const handleHintClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const hintButton = target.closest(".scroll-hint-button");
    if (!hintButton) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollBy({
      left: Math.max(container.clientWidth * 0.6, 160),
      behavior: "smooth",
    });
  };

  return (
    <div
      className="scrollable-table relative"
      data-scrollable={showHint ? "true" : "false"}
      onClick={handleHintClick}
    >
      <div ref={containerRef} className="relative z-10 overflow-x-auto">
        {children}
      </div>
      <div
        className={`pointer-events-none absolute inset-y-0 right-0 z-0 w-14 transition-opacity duration-200 ${
          showHint ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      >
        <div className="absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-neutral-100/90 to-transparent dark:from-neutral-950/90" />
      </div>
    </div>
  );
}
