"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info" | "loading";
type Toast = { id: string; kind: ToastKind; title: string; body?: string; duration?: number };

type ToastApi = {
  push: (toast: Omit<Toast, "id">) => string;
  success: (title: string, body?: string) => string;
  error: (title: string, body?: string) => string;
  info: (title: string, body?: string) => string;
  loading: (title: string, body?: string) => string;
  dismiss: (id: string) => void;
  update: (id: string, patch: Partial<Omit<Toast, "id">>) => void;
};

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  loading: Loader2,
};

const ACCENT: Record<ToastKind, string> = {
  success: "text-mint",
  error: "text-rose-400",
  info: "text-neon-400",
  loading: "text-violet-soft",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const schedule = useCallback(
    (id: string, duration: number) => {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      if (duration <= 0) return;
      const timer = setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id));
        timers.current.delete(id);
      }, duration);
      timers.current.set(id, timer);
    },
    [],
  );

  const push = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = `t_${Math.random().toString(36).slice(2, 10)}`;
      setToasts((list) => [...list.slice(-3), { ...toast, id }]);
      schedule(id, toast.duration ?? (toast.kind === "loading" ? 0 : 4200));
      return id;
    },
    [schedule],
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      dismiss,
      success: (title, body) => push({ kind: "success", title, body }),
      error: (title, body) => push({ kind: "error", title, body, duration: 6000 }),
      info: (title, body) => push({ kind: "info", title, body }),
      loading: (title, body) => push({ kind: "loading", title, body }),
      update: (id, patch) => {
        setToasts((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
        if (patch.duration !== undefined) schedule(id, patch.duration);
      },
    }),
    [push, dismiss, schedule],
  );

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end sm:p-6"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.kind];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.16 } }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="glass-strong pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl p-3.5 shadow-lift"
              >
                <Icon className={cn("mt-0.5 size-4.5 shrink-0", ACCENT[toast.kind], toast.kind === "loading" && "animate-spin")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-mist-50">{toast.title}</p>
                  {toast.body ? <p className="mt-0.5 text-xs leading-relaxed text-mist-400">{toast.body}</p> : null}
                </div>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="rounded-md p-1 text-mist-500 transition hover:bg-white/5 hover:text-mist-50"
                  aria-label="Dismiss"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function AlertBanner({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const map = {
    info: { cls: "border-neon-400/25 bg-neon-400/[0.07] text-neon-200", Icon: Info },
    warning: { cls: "border-amber-400/25 bg-amber-400/[0.07] text-amber-200", Icon: AlertTriangle },
    danger: { cls: "border-rose-400/25 bg-rose-400/[0.07] text-rose-200", Icon: XCircle },
    success: { cls: "border-mint/25 bg-mint/[0.07] text-mint", Icon: CheckCircle2 },
  }[tone];
  const Icon = map.Icon;
  return (
    <div className={cn("flex gap-3 rounded-xl border p-3.5 text-sm", map.cls, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {children ? <div className="mt-1 text-[13px] leading-relaxed opacity-80">{children}</div> : null}
      </div>
    </div>
  );
}