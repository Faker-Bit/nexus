"use client";

import { ServerCrash } from "lucide-react";
import { Container } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="grid min-h-[70dvh] place-items-center py-24">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl border border-rose-400/20 bg-rose-400/8 text-rose-300">
          <ServerCrash className="size-7" />
        </span>
        <h1 className="mt-8 text-xl font-semibold">Something went wrong on our side</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-mist-400">
          The error has been logged. Trying again usually clears it — if it does not, the marketplace is probably
          having a moment.
        </p>
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <ButtonLink href="/">Back home</ButtonLink>
          <button
            onClick={reset}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/14 px-6 text-[15px] text-mist-100 transition-colors hover:border-white/25 hover:bg-white/5"
          >
            Try again
          </button>
        </div>
      </div>
    </Container>
  );
}