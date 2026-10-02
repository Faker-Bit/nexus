import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/motion";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Section({
  children,
  className,
  id,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "default" | "raised" | "flush";
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative py-16 sm:py-20 lg:py-24",
        tone === "raised" && "border-y border-white/6 bg-ink-950/40",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  className,
  icon,
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1.5 text-[11.5px] font-medium uppercase tracking-[0.14em] text-mist-300",
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-6 sm:mb-12",
        align === "center" ? "items-center text-center" : "lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <Reveal className={cn("max-w-2xl", align === "center" && "flex flex-col items-center")}>
        {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
        <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.08]">{title}</h2>
        {description ? (
          <p className="mt-4 text-[15px] leading-relaxed text-mist-400 sm:text-base">{description}</p>
        ) : null}
      </Reveal>
      {action ? (
        <Reveal delay={0.08} className="shrink-0">
          {action}
        </Reveal>
      ) : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative pb-8 pt-10 sm:pt-14", className)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(45,226,255,0.09),transparent_70%)]" />
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
          <h1 className="text-[clamp(2rem,5.2vw,3.4rem)] font-semibold leading-[1.05]">{title}</h1>
          {description ? <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-mist-400">{description}</p> : null}
        </div>
        {children ? <div className="flex shrink-0 flex-wrap gap-2.5">{children}</div> : null}
      </div>
    </div>
  );
}