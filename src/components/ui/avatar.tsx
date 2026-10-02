import Image from "next/image";
import { cn, gradientFor, initials } from "@/lib/utils";
import { VerifiedMark } from "./badge";

const SIZES = { xs: "size-6 text-[10px]", sm: "size-8 text-[11px]", md: "size-10 text-xs", lg: "size-14 text-sm", xl: "size-24 text-2xl", "2xl": "size-36 text-4xl" } as const;

export function Avatar({
  name,
  src,
  size = "md",
  verified,
  className,
  ring = true,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  verified?: boolean;
  className?: string;
  ring?: boolean;
}) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "relative inline-flex items-center justify-center overflow-hidden rounded-full font-semibold text-white/90",
          SIZES[size],
          ring && "ring-1 ring-white/12",
        )}
        style={src ? undefined : { background: gradientFor(name) }}
      >
        {src ? (
          <Image src={src} alt={name} fill sizes="96px" className="object-cover" />
        ) : (
          <span className="drop-shadow-[0_1px_2px] drop-shadow-black/60">{initials(name)}</span>
        )}
      </span>
      {verified ? (
        <VerifiedMark className="absolute -bottom-0.5 -right-0.5 rounded-full bg-void p-[2px]" />
      ) : null}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 5,
  size = "sm",
}: {
  people: Array<{ handle: string; displayName: string; avatarUrl?: string | null }>;
  max?: number;
  size?: keyof typeof SIZES;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <Avatar key={p.handle} name={p.displayName} src={p.avatarUrl} size={size} className={cn(i > 0 && "-ml-2.5")} />
      ))}
      {rest > 0 ? (
        <span
          className={cn(
            "-ml-2.5 inline-flex items-center justify-center rounded-full bg-ink-800 font-semibold text-mist-300 ring-1 ring-white/12",
            SIZES[size],
          )}
        >
          +{rest}
        </span>
      ) : null}
    </div>
  );
}