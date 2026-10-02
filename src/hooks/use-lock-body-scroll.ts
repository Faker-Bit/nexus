"use client";

import { useEffect, useRef } from "react";

/** Freezes background scroll without the iOS jump-to-top bug. */
export function useLockBodyScroll(locked: boolean) {
  const previous = useRef<number | null>(null);

  useEffect(() => {
    if (!locked) return;
    const body = document.body;
    previous.current = window.scrollY;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    body.style.paddingRight = scrollbar > 0 ? `${scrollbar}px` : "";
    return () => {
      body.style.overflow = "";
      body.style.paddingRight = "";
      if (previous.current !== null) window.scrollTo({ top: previous.current, behavior: "instant" as ScrollBehavior });
    };
  }, [locked]);
}