import type { Metadata } from "next";
import Link from "next/link";
import { Compass, SearchX, Wallet } from "lucide-react";
import { Container } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { SceneZone } from "@/components/three/webgl-zone";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Container className="relative isolate grid min-h-[70dvh] place-items-center py-24">
      <SceneZone
        scene="galaxy"
        settings={{ distance: 13, fov: 48, bloom: 0.6, count: 1600 }}
        tone="emerald"
        className="pointer-events-none absolute inset-x-[-10rem] top-0 -z-10 h-[560px] opacity-70"
      />
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-white/8 bg-white/4 text-neon-300">
          <Compass className="size-7" />
        </span>
        <p className="tnum mt-8 font-display text-6xl font-semibold tracking-tight text-gradient">404</p>
        <h1 className="mt-3 text-xl font-semibold">This page shipped to production</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-mist-400">
          The listing may have been archived, the handle may have changed, or the URL might be a typo. Try
          searching instead.
        </p>
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <ButtonLink href="/explore" icon={<SearchX className="size-4" />}>
            Explore projects
          </ButtonLink>
          <ButtonLink href="/" variant="secondary" icon={<Wallet className="size-4" />}>
            Back home
          </ButtonLink>
        </div>
        <p className="mt-8 text-[12px] text-mist-600">
          Think this is a bug?{" "}
          <Link href="/about" className="text-neon-300 hover:text-neon-200">
            Tell us what broke
          </Link>
          .
        </p>
      </div>
    </Container>
  );
}