"use client";

import { useMemo, useState } from "react";
import { Code2, Languages, Package, Rocket, Scale, ShieldCheck } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Markdown } from "@/components/ui/markdown";

/** Icon names are passed as strings so server components stay serialisable. */
const FACT_ICONS = {
  category: Code2,
  stack: Languages,
  license: Scale,
  version: Package,
  updates: ShieldCheck,
  delivery: Rocket,
} as const;

export type FactIcon = keyof typeof FACT_ICONS;


type TabKey = "overview" | "features" | "files" | "docs";

function extractHeadings(markdown: string) {
  return markdown
    .split("\n")
    .filter((line) => /^#{2,3}\s/.test(line))
    .map((line) => {
      const level = line.match(/^#+/)?.[0].length ?? 2;
      return { level, text: line.replace(/^#+\s/, "").trim() };
    });
}

function extractBullets(markdown: string) {
  return markdown
    .split("\n")
    .filter((line) => /^\s*[-*]\s+\S/.test(line))
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter(Boolean);
}

export function ProjectDetailTabs({
  description,
  docsUrl,
  repoUrl,
  demoUrl,
  websiteUrl,
tags,
  facts,
}: {
  description: string;
  docsUrl: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  websiteUrl: string | null;
  tags: string[];
  facts: Array<{ icon: FactIcon; label: string; value: string }>;
}) {
  const [tab, setTab] = useState<TabKey>("overview");

  const headings = useMemo(() => extractHeadings(description), [description]);
  const bullets = useMemo(() => extractBullets(description).slice(0, 12), [description]);

  const links = [
    { href: demoUrl, label: "Live demo" },
    { href: repoUrl, label: "Repository" },
    { href: docsUrl, label: "Documentation" },
    { href: websiteUrl, label: "Website" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));

  return (
    <div>
      <Tabs
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "features", label: "Highlights" },
          { key: "files", label: "Stack & licence" },
          { key: "docs", label: "Links" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className="pt-6">
        {tab === "overview" ? (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="min-w-0">
              <Markdown content={description} />
              {headings.length > 1 ? (
                <div className="mt-8 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-500">On this page</p>
                  <ul className="mt-2.5 space-y-1.5">
                    {headings.map((heading, i) => (
                      <li key={i} className="text-[12.5px] text-mist-400">
                        {heading.level === 2 ? "" : <span className="pl-3">↳ </span>}
                        {heading.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

<dl className="space-y-3 self-start lg:sticky lg:top-24">
              {facts.map((fact) => {
                const FactIcon = FACT_ICONS[fact.icon];
                return (
                  <div key={fact.label} className="glass flex items-start gap-3 rounded-xl p-3">
                    <FactIcon className="mt-0.5 size-3.5 shrink-0 text-neon-300" />
                    <div className="min-w-0">
                      <dt className="text-[10.5px] uppercase tracking-wider text-mist-500">{fact.label}</dt>
                      <dd className="truncate text-[13px] text-mist-100">{fact.value}</dd>
                    </div>
                  </div>
                );
              })}
              {tags.length ? (
                <div className="glass rounded-xl p-3">
                  <dt className="text-[10.5px] uppercase tracking-wider text-mist-500">Tags</dt>
                  <dd className="mt-2 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-white/8 bg-white/4 px-1.5 py-0.5 font-mono text-[10px] text-mist-400">
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}

        {tab === "features" ? (
          <div>
            {bullets.length ? (
              <ul className="grid gap-2.5 sm:grid-cols-2">
                {bullets.map((item, i) => (
                  <li key={i} className="glass flex items-start gap-2.5 rounded-xl p-3.5 text-[13px] text-mist-300">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-neon-400 shadow-[0_0_8px] shadow-neon-400" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13.5px] text-mist-400">This creator did not list features in bullet form.</p>
            )}

            {headings.length ? (
              <div className="mt-8 space-y-6">
                {headings.map((heading, i) => (
                  <section key={i}>
                    <h3 className="text-[15px] font-semibold">{heading.text}</h3>
                    <Markdown content={sectionFor(description, heading.text)} compact />
                  </section>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {tab === "files" ? (
          <div className="space-y-4">
            <p className="text-[13.5px] leading-relaxed text-mist-400">
              Every purchase delivers the source archive plus assets through a signed, audited download. Files are never
              served from a public bucket - each download is logged against your licence.
            </p>
<div className="grid gap-3 sm:grid-cols-2">
              {facts.map((fact) => {
                const FactIcon = FACT_ICONS[fact.icon];
                return (
                  <div key={fact.label} className="glass rounded-xl p-4">
                    <FactIcon className="size-4 text-neon-300" />
                    <p className="mt-2.5 text-[13px] text-mist-100">{fact.label}</p>
                    <p className="text-[11.5px] text-mist-500">{fact.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {tab === "docs" ? (
          <div className="space-y-4">
            {links.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="glass group flex items-center justify-between gap-3 rounded-xl p-4 transition-all hover:border-neon-400/35"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-medium text-mist-50">{link.label}</span>
                      <span className="block truncate text-[11.5px] text-mist-500">{link.href}</span>
                    </span>
                    <span className="text-mist-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-[13.5px] text-mist-400">No external links were provided for this listing.</p>
            )}
            <p className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-[12.5px] leading-relaxed text-mist-400">
              Missing documentation is a common reason for refunds. If a listing promised docs and they are not in the
              archive, contact support within 30 days for a full refund.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Returns the markdown slice under a given heading. */
function sectionFor(markdown: string, heading: string) {
  const lines = markdown.split("\n");
  const start = lines.findIndex((l) => l.replace(/^#+\s/, "").trim() === heading);
  if (start === -1) return "";
  const rest = lines.slice(start + 1);
  const nextHeading = rest.findIndex((l) => /^#{2,3}\s/.test(l));
  return (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).join("\n");
}