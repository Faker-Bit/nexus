import Link from "next/link";
import { Award, BadgeCheck, MapPin, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { formatCompact } from "@/lib/utils";

export function CreatorMiniCard({
  creator,
  detailed,
}: {
  creator: { handle: string; displayName: string; avatarUrl: string | null; verified: boolean; location?: string | null };
  detailed?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <Avatar name={creator.displayName} src={creator.avatarUrl} verified={creator.verified} size="lg" />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[14px] font-semibold text-mist-50">
            {creator.displayName}
            <BadgeCheck className="size-3.5 shrink-0 text-neon-300" />
          </p>
          <Link href={`/c/${creator.handle}`} className="text-[12px] text-mist-500 transition-colors hover:text-neon-200">
            @{creator.handle}
          </Link>
          {creator.location ? (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-mist-600">
              <MapPin className="size-3" />
              {creator.location}
            </p>
          ) : null}
        </div>
      </div>

      {detailed ? (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/8 py-3 text-center">
            <div>
              <p className="tnum text-[15px] font-semibold text-mist-50">-</p>
              <p className="text-[10px] uppercase tracking-wider text-mist-600">Reputation</p>
            </div>
            <div>
              <p className="tnum text-[15px] font-semibold text-mist-50">-</p>
              <p className="text-[10px] uppercase tracking-wider text-mist-600">Sales</p>
            </div>
            <div>
              <p className="tnum text-[15px] font-semibold text-mist-50">-</p>
              <p className="text-[10px] uppercase tracking-wider text-mist-600">Rating</p>
            </div>
          </div>
          <ButtonLink href={`/c/${creator.handle}`} variant="secondary" size="sm" full className="mt-4">
            View profile
          </ButtonLink>
        </>
      ) : null}
    </div>
  );
}

export function CreatorStatsRow({
  reputation,
  sales,
  rating,
  projects,
}: {
  reputation: number;
  sales: number;
  rating: number;
  projects: number;
}) {
  const items = [
    { icon: Award, label: "Reputation", value: String(reputation) },
    { icon: MessageSquare, label: "Sales", value: formatCompact(sales) },
    { icon: BadgeCheck, label: "Rating", value: rating > 0 ? rating.toFixed(1) : "New" },
    { icon: Award, label: "Projects", value: String(projects) },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/8 bg-white/6 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="bg-ink-950/70 px-4 py-3.5 text-center">
          <dd className="tnum flex items-center justify-center gap-1.5 text-[17px] font-semibold text-mist-50">
            <item.icon className="size-3.5 text-neon-300" />
            {item.value}
          </dd>
          <dt className="mt-0.5 text-[10.5px] uppercase tracking-wider text-mist-500">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}