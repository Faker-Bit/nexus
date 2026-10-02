"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll";

const SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl", full: "max-w-6xl" } as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissable = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: keyof typeof SIZES;
  dismissable?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useLockBodyScroll(open);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) onClose();
      if (e.key === "Tab") {
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevFocus = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("[data-autofocus],input,button")?.focus();
    }, 60);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
      prevFocus?.focus?.();
    };
  }, [open, onClose, dismissable]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-void/82 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={dismissable ? onClose : undefined}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "glass-strong relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl shadow-lift sm:rounded-3xl",
              SIZES[size],
            )}
            initial={{ opacity: 0, y: 32, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {(title || dismissable) && (
              <header className="flex items-start justify-between gap-4 border-b border-white/7 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  {title ? <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2> : null}
                  {description ? <p className="mt-0.5 text-[13px] leading-relaxed text-mist-400">{description}</p> : null}
                </div>
                {dismissable ? (
                  <button
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="-mr-1 rounded-lg p-1.5 text-mist-500 transition hover:bg-white/8 hover:text-mist-50"
                  >
                    <X className="size-4.5" />
                  </button>
                ) : null}
              </header>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">{children}</div>
            {footer ? <footer className="border-t border-white/7 bg-black/25 px-5 py-4 sm:px-6">{footer}</footer> : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

/** Right-hand slide-over used for offer dialogs and quick views. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  side?: "right" | "left";
}) {
  const [mounted, setMounted] = useState(false);
  useLockBodyScroll(open);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[105]">
          <motion.div
            className="absolute inset-0 bg-void/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={cn(
              "glass-strong absolute top-0 flex h-full w-full max-w-md flex-col",
              side === "right" ? "right-0 border-l" : "left-0 border-r",
              "border-white/8",
            )}
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
          >
            {title ? (
              <header className="flex items-center justify-between border-b border-white/8 px-5 py-4">
                <h2 className="text-base font-semibold">{title}</h2>
                <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-mist-500 hover:bg-white/8 hover:text-mist-50">
                  <X className="size-4.5" />
                </button>
              </header>
            ) : null}
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  tone = "primary",
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  body: string;
  confirmLabel?: string;
  tone?: "primary" | "danger";
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="h-10 rounded-xl px-4 text-sm text-mist-300 transition hover:bg-white/6 hover:text-mist-50">
            Cancel
          </button>
          <button
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onClose();
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className={cn(
              "h-10 rounded-xl px-5 text-sm font-medium transition disabled:opacity-50",
              tone === "danger"
                ? "bg-rose-500/80 text-white hover:bg-rose-500"
                : "bg-linear-to-r from-neon-300 to-neon-400 text-void hover:brightness-110",
            )}
          >
            {busy ? "Working-" : confirmLabel}
          </button>
        </div>
      }
    >
      <p className="text-sm leading-relaxed text-mist-300">{body}</p>
    </Modal>
  );
}