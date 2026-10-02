"use client";

import { PageTransition } from "@/components/ui/effects";

/**
 * Re-mounts on every navigation, which makes it the correct place for the
 * enter transition shared by all pages.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}