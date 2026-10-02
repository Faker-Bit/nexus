import Link from "next/link";
import { Award, MapPin, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/rating";
import { VerifiedMark } from "@/components/ui/badge";
import { cn, formatCompact, formatUSD } from "@/lib/utils";

export type CreatorSummary = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  verified: boolean;
  reputation: number;
  totalSales: number;
  totalEarningsCents: number;
  ratingAvg: number;
  ratingCount: number;
  location: string | null;
  projectCount?: number;
  followerCount?: number;
};

export function CreatorCard({
  creator,
  projects = [],
  className,
}: {
  creator: CreatorSummary;
  projects?: Array<{ slug: string; title: string; priceCents: number; hue: string }>;
  className?: string;
}) {
  return (
    <Link
      href={`/c/${creator.handle}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/7 bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/16",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-neon-400/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

      <div className="flex items-start gap-3">
        <Avatar name={creator.displayName} src={creator.avatarUrl} verified={creator.verified} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[14.5px] font-semibold text-mist-50">{creator.displayName}</p>
            <VerifiedMark />
          </div>
          <p className="truncate text-[12px] text-mist-500">@{creator.handle}</p>
          {creator.location ? (
            <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-mist-600">
              <MapPin className="size-3" />
              {creator.location}
            </p>
          ) : null}
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber/25 bg-amber/8 px-2 py-0.5 text-[10.5px] font-medium text-amber">
          <Award className="size-3" />
          {creator.reputation}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-mist-400">{creator.bio}</p>

      <div className="mt-3.5 flex items-center gap-3">
        <Stars value={creator.ratingAvg} size="xs" showValue />
        {creator.ratingCount ? <span className="text-[11px] text-mist-600">({creator.ratingCount} reviews)</span> : null}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/7 pt-3 text-center">
        <div>
          <dt className="text-[9.5px] uppercase tracking-wider text-mist-600">Projects</dt>
          <dd className="tnum text-[13px] font-medium text-mist-100">{creator.projectCount ?? projects.length}</dd>
        </div>
        <div>
          <dt className="text-[9.5px] uppercase tracking-wider text-mist-600">Sales</dt>
          <dd className="tnum text-[13px] font-medium text-mist-100">{formatCompact(creator.totalSales)}</dd>
        </div>
        <div>
          <dt className="text-[9.5px] uppercase tracking-wider text-mist-600">Earned</dt>
          <dd className="tnum text-[13px] font-medium text-mist-100">{formatUSD(creator.totalEarningsCents)}</dd>
        </div>
      </dl>

      {creator.followerCount ? (
        <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-mist-600">
          <Users className="size-3" />
          {formatCompact(creator.followerCount)} followers
        </p>
      ) : null}
    </Link>
  );
}