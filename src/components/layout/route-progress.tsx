"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export function RouteProgress() {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className="pointer-events-none fixed inset-x-0 top-0 z-[130] h-0.5 origin-left"
        initial={{ scaleX: 0, opacity: 0.9 }}
        animate={{ scaleX: 1, opacity: 0 }}
        transition={{ scaleX: { duration: 0.85, ease: [0.16, 1, 0.3, 1] }, opacity: { duration: 0.5, delay: 0.45 } }}
        style={{ background: "linear-gradient(90deg, #5cffb4, #00ff9d, #6fffd0)" }}
      />
    </AnimatePresence>
  );
}