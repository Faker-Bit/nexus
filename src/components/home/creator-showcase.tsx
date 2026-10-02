import Link from "next/link";
import { ArrowRight, Award, MapPin, TrendingUp } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Stars } from "@/components/ui/rating";
import { Badge, VerifiedMark } from "@/components/ui/badge";
import { Reveal } from "@/components/ui/motion";
import { Container, SectionHeading } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { formatCompact, formatUSD } from "@/lib/utils";
import { SceneZone } from "@/components/three/webgl-zone";

type CreatorRow = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  bio: string | null;
  reputation: number;
  totalSales: number;
  totalEarningsCents: number;
  ratingAvg: number;
  ratingCount: number;
  location: string | null;
  github: string | null;
  twitter: string | null;
  createdAt: Date;
  _count: { projects: number; followers: number };
};

export function CreatorShowcase({
  creators,
  showcase,
}: {
  creators: CreatorRow[];
  showcase: Array<{ slug: string; title: string; priceCents: number; hue: string; creator: string }>;
}) {
  if (!creators.length) return null;

  return (
    <section className="cv-auto relative isolate overflow-hidden py-20">
      <SceneZone scene="galaxy" settings={{ distance: 13, fov: 48, bloom: 0.62 }}
          
        tone="jade"
        className="pointer-events-none absolute inset-0 -z-10 opacity-75"
              />
      <Container>
        <SectionHeading
          eyebrow="Creators"
          title="The people shipping the work"
          description="Reputation here is earned - verified identity, delivered files and buyers who came back."
          action={
            <ButtonLink href="/explore/creators" variant="outline" size="sm" iconRight={<ArrowRight className="size-3.5" />}>
              Meet all creators
            </ButtonLink>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {creators.slice(0, 8).map((creator, i) => (
            <Reveal key={creator.id} delay={i * 0.05}>
              <Link
                href={`/c/${creator.handle}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/7 bg-white/[0.025] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/16"
              >
                <div className="pointer-events-none absolute -right-10 -top-12 size-32 rounded-full bg-violet-neon/16 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
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
                </div>

                <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-mist-400">{creator.bio}</p>

                <div className="mt-4 flex items-center gap-3">
                  <Stars value={creator.ratingAvg} size="xs" showValue />
                  <span className="text-[11px] text-mist-600">({creator.ratingCount})</span>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/7 pt-3 text-center">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-mist-600">Sales</dt>
                    <dd className="tnum text-[13px] font-medium text-mist-100">{formatCompact(creator.totalSales)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-mist-600">Earned</dt>
                    <dd className="tnum text-[13px] font-medium text-mist-100">{formatUSD(creator.totalEarningsCents)}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wider text-mist-600">Rep</dt>
                    <dd className="flex items-center justify-center gap-1 text-[13px] font-medium text-mist-100">
                      <Award className="size-3 text-amber" />
                      {creator.reputation}
                    </dd>
                  </div>
                </dl>
              </Link>
            </Reveal>
          ))}
        </div>

        {showcase.length ? (
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-mist-500">
              <TrendingUp className="size-3.5" />
              Fresh from top creators
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {showcase.map((project, i) => (
                <Reveal key={project.slug} delay={i * 0.05}>
                  <Link
                    href={`/p/${project.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-white/7 bg-white/[0.022] p-3 transition-all hover:border-white/16 hover:bg-white/5"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: project.hue, boxShadow: `0 0 10px ${project.hue}` }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-mist-100">{project.title}</span>
                      <span className="block truncate text-[11px] text-mist-500">
                        @{project.creator}
                      </span>
                    </span>
                    <span className="tnum shrink-0 text-[12.5px] font-medium text-mist-50">
                      {formatUSD(project.priceCents)}
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        ) : null}
      </Container>
    </section>
  );
}

export function CreatorBadgeRow({ creators }: { creators: CreatorRow[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {creators.slice(0, 6).map((c) => (
        <Link
          key={c.id}
          href={`/c/${c.handle}`}
          className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/3 py-1 pl-1 pr-3 text-[12px] text-mist-300 transition-colors hover:border-white/20 hover:text-mist-50"
        >
          <Avatar name={c.displayName} src={c.avatarUrl} size="xs" verified={c.verified} />
          {c.displayName}
        </Link>
      ))}
      <Badge tone="neutral" className="ml-1">
        + more
      </Badge>
    </div>
  );
}