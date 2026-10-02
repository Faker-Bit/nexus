"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { AlertCircle, Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full rounded-xl border border-white/10 bg-ink-900/70 px-3.5 text-sm text-mist-50 shadow-inner transition-all duration-200 placeholder:text-mist-600 hover:border-white/16 focus:border-neon-400/60 focus:bg-ink-900/90 focus:outline-none focus:ring-2 focus:ring-neon-400/18 disabled:opacity-55";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
  htmlFor,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="flex items-center gap-1 text-[12.5px] font-medium text-mist-300">
          {label}
          {required ? <span className="text-neon-400">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-[12px] text-rose-300">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] leading-relaxed text-mist-500">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean; loading?: boolean }>(
  function Input({ className, invalid, loading, ...rest }, ref) {
    return (
      <div className="relative">
        <input
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(FIELD, "h-11", invalid && "border-rose-400/55 focus:ring-rose-400/20", className)}
          {...rest}
        />
        {loading ? <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-mist-500" /> : null}
      </div>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, rows = 5, ...rest }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(FIELD, "resize-y py-3 leading-relaxed", invalid && "border-rose-400/55", className)}
        {...rest}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={cn(FIELD, "h-11 appearance-none pr-9", className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
    </div>
  );
});

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="cursor-pointer select-none">
        <span className="block text-sm font-medium text-mist-100">{label}</span>
        {description ? <span className="mt-0.5 block text-[12.5px] leading-relaxed text-mist-500">{description}</span> : null}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-all duration-300",
          checked
            ? "border-neon-400/50 bg-neon-400/22 shadow-[0_0_18px_-4px] shadow-neon-400/60"
            : "border-white/12 bg-white/6",
          disabled && "opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4.5 rounded-full bg-mist-50 transition-all duration-300",
            checked ? "left-[1.35rem] bg-neon-200 shadow-[0_0_10px] shadow-neon-400/70" : "left-0.5 bg-mist-400",
          )}
        />
      </button>
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer select-none items-start gap-2.5 text-[13px] text-mist-300", className)}>
      <span
        className={cn(
          "mt-px flex size-4.5 shrink-0 items-center justify-center rounded-[6px] border transition-all duration-200",
          checked ? "border-neon-400 bg-neon-400 text-void" : "border-white/18 bg-white/4 hover:border-white/30",
        )}
      >
        {checked ? <Check className="size-3" strokeWidth={3} /> : null}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={typeof label === "string" ? label : undefined}
      />
      <span className="leading-relaxed">{label}</span>
    </label>
  );
}

/** Stepper used for prices and offer amounts. */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 1_000_000,
  step = 1,
  prefix,
  suffix,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-ink-900/70", className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-10 shrink-0 text-mist-400 transition hover:bg-white/6 hover:text-mist-50 disabled:opacity-40"
        disabled={value <= min}
        aria-label="Decrease"
      >
        −
      </button>
      <div className="relative flex-1">
        {prefix ? <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-mist-500">{prefix}</span> : null}
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn("h-10 w-full bg-transparent text-center text-sm tnum outline-none", prefix && "pl-7", suffix && "pr-8")}
        />
        {suffix ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-mist-500">{suffix}</span> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-10 shrink-0 text-mist-400 transition hover:bg-white/6 hover:text-mist-50 disabled:opacity-40"
        disabled={value >= max}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}

/** Live-updating character counter for long-form inputs. */
export function Counter({ value, max }: { value: number; max: number }) {
  const near = value > max * 0.9;
  return (
    <span className={cn("tnum text-[11.5px]", near ? "text-amber" : "text-mist-600")}>
      {value}/{max}
    </span>
  );
}