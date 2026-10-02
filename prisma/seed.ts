#!/usr/bin/env node
/**
 * NEXUS dev seed - realistic marketplace content so the UI is never empty.
 * Idempotent-ish: wipes marketplace tables then repopulates.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]) => arr[rnd(arr.length)];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

const creators = [
  { handle: "nova", displayName: "Nova Arsenault", bio: "Distributed systems engineer building agent runtimes and dev tooling.", location: "Lisbon, PT", github: "nova", twitter: "nova_builds", verified: true, rating: 4.9, ratingCount: 318, sales: 1420, rep: 98, earnings: 1842000 },
  { handle: "kaito", displayName: "Kaito Mori", bio: "Former game studio tech lead. Now shipping bots, plugins and realtime toys.", location: "Tokyo, JP", github: "kaito", twitter: "kaito_mori", verified: true, rating: 4.8, ratingCount: 204, sales: 980, rep: 94, earnings: 1120000 },
  { handle: "aurel", displayName: "Aurel Voss", bio: "Indie hacker. Design systems, landing pages and tiny SaaS in a weekend.", location: "Berlin, DE", github: "aurel", twitter: "aurelv", verified: false, rating: 4.6, ratingCount: 96, sales: 410, rep: 81, earnings: 386000 },
  { handle: "sable", displayName: "Sable Idowu", bio: "AI researcher turned builder. Fine-tuning utilities, RAG infra, eval harnesses.", location: "Lagos, NG", github: "sable", twitter: "sable_ai", verified: true, rating: 5.0, ratingCount: 142, sales: 760, rep: 96, earnings: 1340000 },
  { handle: "kit", displayName: "Kit Marlowe", bio: "Automation scripts for creators. Scrapers, renderers, batch tooling.", location: "Austin, US", github: "kit", twitter: "kitm", verified: false, rating: 4.7, ratingCount: 61, sales: 265, rep: 76, earnings: 214000 },
  { handle: "vega", displayName: "Vega Novak", bio: "3D + WebGL engineer. Selling shaders, particle kits and interactive scenes.", location: "Prague, CZ", github: "vega", twitter: "vega_gl", verified: true, rating: 4.9, ratingCount: 88, sales: 340, rep: 92, earnings: 502000 },
  { handle: "mira", displayName: "Mira Solano", bio: "Fullstack freelancer turned product builder. Templates that actually convert.", location: "Barcelona, ES", github: "mira", twitter: "mirasol", verified: false, rating: 4.5, ratingCount: 173, sales: 620, rep: 79, earnings: 448000 },
  { handle: "rhys", displayName: "Rhys Okonkwo", bio: "Quant + data tooling. Dashboards, backtesters, dataset packs.", location: "Manchester, UK", github: "rhys", twitter: "rhysq", verified: true, rating: 4.8, ratingCount: 47, sales: 190, rep: 85, earnings: 296000 },
];

type ProjectSeed = {
  title: string;
  category: string;
  language: string;
  price: number;
  tags: string[];
  summary: string;
  description: string;
  demo?: string;
  repo?: string;
  docs?: string;
  license?: string;
  featured?: boolean;
  meme?: string;
};

const projectSeeds: ProjectSeed[] = [
  {
    title: "Helix Agent Runtime",
    category: "ai",
    language: "TypeScript",
    price: 24900,
    tags: ["ai", "agents", "runtime", "llm", "orchestration"],
    summary: "Production agent runtime with tool-calling, memory graphs, retries and cost telemetry.",
    description:
      "Helix is a batteries-included runtime for building autonomous agents. Ships with a typed tool registry, vector memory with automatic pruning, parallel fan-out execution, structured output validation and a full event log you can replay.\n\n**Why teams buy it:** you ship agents in an afternoon, not a sprint. Ships with 12 provider adapters, a token budget guard, human-in-the-loop checkpoints and a tracing UI that plugs straight into your existing dashboard.\n\nIncludes 40+ production recipes, typed SDK, and a CLI that scaffolds a working agent in seconds.",
    demo: "https://helix-runtime.dev",
    repo: "https://github.com/nova/helix-runtime",
    docs: "https://helix-runtime.dev/docs",
    license: "commercial",
    featured: true,
  },
  {
    title: "Autotrade Bot v4",
    category: "bot",
    language: "Python",
    price: 12900,
    tags: ["trading", "bot", "binance", "strategy", "backtest"],
    summary: "Multi-strategy execution bot for CEX/DEX with paper-trading and a backtest engine.",
    description:
      "A complete execution framework rather than a black box. Ships with grid, momentum, mean-reversion and funding-arbitrage strategies, plus a deterministic backtester that replays historical L2 order books.\n\nRisk engine enforces per-strategy exposure caps, daily loss circuit breakers and cooldown windows. Positions are reconciled against the exchange every tick so drift is impossible to ignore.\n\nEvery parameter is documented. Nothing is obfuscated, nothing phones home.",
    repo: "https://github.com/kaito/autotrade",
    license: "mit",
    featured: true,
  },
  {
    title: "SableRAG",
    category: "ai",
    language: "Python",
    price: 18900,
    tags: ["rag", "embeddings", "vector", "llm", "infra"],
    summary: "Retrieval stack with hybrid search, rerankers and an eval harness that actually scores.",
    description:
      "Most RAG stacks guess. SableRAG measures. Hybrid BM25 + dense retrieval, cross-encoder reranking, query rewriting and a built-in eval harness that reports recall@k, MRR and answer faithfulness against your own eval set.\n\nAdapters for Postgres pgvector, Qdrant, Weaviate and LanceDB. Ships with a FastAPI gateway, streaming responses and OpenTelemetry spans.",
    docs: "https://sablerag.io/docs",
    repo: "https://github.com/sable/sablerag",
    license: "apache-2.0",
  },
  {
    title: "Glasskit - WebGL UI Kit",
    category: "template",
    language: "TypeScript",
    price: 7900,
    tags: ["three.js", "webgl", "ui", "shaders", "react"],
    summary: "42 glassmorphic WebGL components with live shader controls and zero jank.",
    description:
      "A design system for the 3D web. Glass panels, refractive borders, animated gradient meshes, volumetric light cards - all GPU-driven.\n\nEvery component ships with a live control panel, respects prefers-reduced-motion, and degrades to a static backdrop when WebGL is unavailable.",
    demo: "https://glasskit.dev",
    repo: "https://github.com/vega/glasskit",
    license: "mit",
    featured: true,
  },
  {
    title: "ParticleField Pro",
    category: "template",
    language: "JavaScript",
    price: 4900,
    tags: ["particles", "three.js", "webgl", "shader", "performance"],
    summary: "GPU particle system reaching 1M points at 60fps on integrated graphics.",
    description:
      "Instanced point clouds, curl-noise flow fields and GPGPU simulation buffers. Includes presets: aurora, swarm, galaxy, smoke and network graph.\n\nUses transform feedback where available and falls back to vertex-shader integration. Ships with an FPS budget HUD and an adaptive quality controller.",
    demo: "https://particlefield.pro",
    license: "commercial",
  },
  {
    title: "Pulse - Analytics Dashboard Kit",
    category: "template",
    language: "TypeScript",
    price: 8900,
    tags: ["dashboard", "recharts", "saas", "tailwind", "charts"],
    summary: "60+ dashboard blocks: cohort tables, funnels, retention grids, realtime sparklines.",
    description:
      "Built for SaaS teams that hate building analytics UIs. Realtime tiles, cohort retention grids, funnel explorers, and an anomaly overlay that highlights the spike for you.\n\nPairs with any SQL source. Ships with light/dark themes, dense and comfortable modes, and a Figma library.",
    demo: "https://pulsekit.io",
    repo: "https://github.com/aurel/pulse",
    license: "mit",
  },
  {
    title: "Shipfast Landing Templates",
    category: "website",
    language: "TypeScript",
    price: 5900,
    tags: ["landing", "next.js", "seo", "conversion", "tailwind"],
    summary: "14 conversion-tested landing pages with copy guidance and A/B hooks built in.",
    description:
      "Not just markup - each template includes the copy framework that made it convert, plus variant slots for hero, pricing and CTA experiments.\n\nNext.js App Router, zero client JS below the fold, perfect Lighthouse scores out of the box.",
    demo: "https://shipfast.pages.dev",
    license: "commercial",
  },
  {
    title: "CrawlKit - Scraper Suite",
    category: "script",
    language: "Node.js",
    price: 6900,
    tags: ["scraper", "crawler", "automation", "proxy", "puppeteer"],
    summary: "Resilient crawler with proxy rotation, JS rendering and auto-retry heuristics.",
    description:
      "Built after 4 years of production crawling. Handles JS-heavy sites via a managed browser pool, rotates proxies adaptively, backs off on 429/5xx and resumes from a durable checkpoint queue.\n\nExport to JSON/CSV/Parquet. Ships with 14 adapter recipes for common targets.",
    repo: "https://github.com/kit/crawlkit",
    license: "apache-2.0",
  },
  {
    title: "BatchRender",
    category: "script",
    language: "Python",
    price: 3900,
    tags: ["render", "ffmpeg", "automation", "video", "batch"],
    summary: "Parallel video rendering pipeline with GPU passthrough and manifest tracking.",
    description:
      "Turn a folder of source clips into a delivery manifest. Parallel ffmpeg orchestration, GPU encoder detection, subtitle burn-in, and a SQLite manifest so nothing renders twice.\n\nCLI + Python API. Works on a single laptop or a 64-core box.",
    license: "mit",
  },
  {
    title: "Orbit Design System",
    category: "template",
    language: "TypeScript",
    price: 11900,
    tags: ["design system", "tailwind", "tokens", "a11y", "storybook"],
    summary: "Token-driven design system with 300+ accessible components and Figma sync.",
    description:
      "A system, not a component dump. Semantic tokens flow from one source of truth into Tailwind, CSS variables, iOS/Android and Figma.\n\nWCAG 2.2 AA audited. Every interactive component has keyboard specs, focus stories and screen-reader labels.",
    repo: "https://github.com/mira/orbit-ds",
    license: "apache-2.0",
    featured: true,
  },
  {
    title: "QuantLab Backtester",
    category: "code",
    language: "Python",
    price: 15900,
    tags: ["quant", "backtest", "finance", "numpy", "research"],
    summary: "Vectorised backtesting engine with walk-forward validation and slippage models.",
    description:
      "Run strategies over years of data in seconds. Vectorised core, walk-forward optimiser, Monte Carlo robustness tests and realistic fee/slippage/impact models.\n\nPlugs into your existing research notebook. Exports a full equity attribution breakdown.",
    demo: "https://quantlab.dev",
    license: "commercial",
    meme: "WIF",
  },
  {
    title: "Nova SDK - Solana Client",
    category: "code",
    language: "Rust",
    price: 9900,
    tags: ["solana", "rust", "sdk", "web3", "anchor"],
    summary: "Zero-copy Solana client with anchor helpers, tx simulation and priority fees.",
    description:
      "A fast, typed Solana client. Account zero-copy decoding, transaction simulation before you send, automatic priority-fee bidding and ergonomic Anchor program helpers.\n\nIncludes a local validator harness and a tx replay debugger.",
    repo: "https://github.com/nova/nova-sdk",
    license: "mit",
  },
  {
    title: "Telegram Bot Framework",
    category: "bot",
    language: "TypeScript",
    price: 6900,
    tags: ["telegram", "bot", "framework", "sessions", "payments"],
    summary: "Session-scoped bot framework with inline checkout, rate limiting and admin tooling.",
    description:
      "Forget the 200-line handler files. Scene-based conversations, typed commands, per-user rate limits, inline keyboards with crypto checkout, and an admin dashboard for broadcasts and analytics.\n\nIncludes webhook + long-poll transports with automatic failover.",
    license: "apache-2.0",
  },
  {
    title: "Streamline Bot Pack",
    category: "bot",
    language: "JavaScript",
    price: 4400,
    tags: ["discord", "bot", "moderation", "music", "utility"],
    summary: "30 drop-in Discord bots: moderation, music, levels, tickets, welcome flows.",
    description:
      "Install what you need, ignore the rest. Each bot is independently deployable with shared config, shared analytics and a one-command dashboard.\n\nIncludes a permissions visualiser so non-admins stop breaking things.",
    license: "mit",
  },
  {
    title: "VoiceForge",
    category: "ai",
    language: "Python",
    price: 13900,
    tags: ["tts", "voice", "audio", "speech", "model"],
    summary: "Local-first text-to-speech with 40ms streaming and emotional prosody control.",
    description:
      "Streaming TTS you can self-host. Sub-40ms chunk latency, 11 languages, emotional prosody via simple tags like <calm> and <excited>.\n\nExposes a WebSocket API and drops into any app with 20 lines. Ships with pronunciation lexicons.",
    demo: "https://voiceforge.dev",
    license: "commercial",
    meme: "PEPE",
  },
  {
    title: "PromptVault",
    category: "ai",
    language: "TypeScript",
    price: 3400,
    tags: ["prompts", "library", "evaluation", "testing", "llm"],
    summary: "Versioned prompt library with A/B testing, diffing and regression suites.",
    description:
      "Prompts are code. Version them, diff them, test them. PromptVault stores prompts with typed variables, runs them against a test suite, and blocks merges that regress quality scores.\n\nEditor with diff view, cost tracking per call and a full audit log.",
    license: "mit",
  },
  {
    title: "Market Pulse Dataset",
    category: "code",
    language: "Python",
    price: 21900,
    tags: ["dataset", "crypto", "analytics", "ohlcv", "research"],
    summary: "Five years of clean OHLCV + on-chain flow data for 400 assets, research-ready.",
    description:
      "Gaps filled, outliers winsorised, and every transformation documented in the shipped notebook. Includes on-chain net flow, exchange inflow/outflow and a labelled regime column for regime-aware backtests.\n\nParquet, DuckDB and Polars friendly.",
    license: "commercial",
  },
  {
    title: "InvoiceFlow Plugin",
    category: "plugin",
    language: "TypeScript",
    price: 2900,
    tags: ["plugin", "invoicing", "payments", "stripe", "automation"],
    summary: "Crypto-native invoicing plugin: on-chain invoices, auto-reconciliation, webhooks.",
    description:
      "Add crypto invoicing to your app in a weekend. Generates addresses per invoice, watches for confirmations, reconciles against your ledger and fires webhooks.\n\nSupports stablecoins, native assets and memecoin rails.",
    repo: "https://github.com/mira/invoiceflow",
    license: "apache-2.0",
  },
];

const buyers = [
  { handle: "demo", displayName: "Demo Buyer", email: "demo@nexus.dev", isCreator: false },
  { handle: "jules", displayName: "Jules Adeyemi", email: "jules@example.com", isCreator: false },
  { handle: "hana", displayName: "Hana Bergström", email: "hana@example.com", isCreator: false },
  { handle: "omar", displayName: "Omar Haddad", email: "omar@example.com", isCreator: false },
  { handle: "lu", displayName: "Lu Wen", email: "lu@example.com", isCreator: false },
];

async function main() {
  console.log("Resetting tables-");
  await prisma.notification.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.download.deleteMany();
  await prisma.projectLike.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.order.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.project.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  console.log("Creating creators-");
  const creatorRows = [];
  for (const c of creators) {
    creatorRows.push(
      await prisma.user.create({
        data: {
          email: `${c.handle}@nexus.dev`,
          passwordHash,
          handle: c.handle,
          displayName: c.displayName,
          bio: c.bio,
          location: c.location,
          github: c.github,
          twitter: c.twitter,
          isCreator: true,
          verified: c.verified,
          reputation: c.rep,
          ratingAvg: c.rating,
          ratingCount: c.ratingCount,
          totalSales: c.sales,
          totalEarningsCents: c.earnings,
          payoutAddress: "0x" + "a1b2c3d4e5f6".repeat(4),
          defaultChain: "base",
          createdAt: new Date(Date.now() - rnd(700) * 86400000),
        },
      }),
    );
  }

  console.log("Creating buyers-");
  const buyerRows = [];
  for (const b of buyers) {
    buyerRows.push(
      await prisma.user.create({
        data: {
          email: b.email,
          passwordHash,
          handle: b.handle,
          displayName: b.displayName,
          bio: "Collector of useful software.",
          isCreator: b.isCreator,
          createdAt: new Date(Date.now() - rnd(300) * 86400000),
        },
      }),
    );
  }

  // Give the demo buyer a wallet so wallet flows are testable end-to-end.
  await prisma.wallet.create({
    data: { userId: buyerRows[0].id, chain: "ethereum", address: "0x" + "d3e4".repeat(10), label: "Demo wallet", isPrimary: true },
  });

  console.log("Creating projects-");
  const projects = [];
  for (let i = 0; i < projectSeeds.length; i++) {
    const seed = projectSeeds[i];
    const creator = creatorRows[i % creatorRows.length];
    const daysAgo = rnd(240);
    const p = await prisma.project.create({
      data: {
        slug: slugify(seed.title),
        title: seed.title,
        tagline: seed.summary,
        summary: seed.summary,
        description: seed.description,
        category: seed.category,
        language: seed.language,
        license: seed.license ?? "commercial",
        tagsString: seed.tags.join(","),
        priceCents: seed.price,
        originalPriceCents: rnd(3) === 0 ? Math.round(seed.price * 1.6) : null,
        currency: pick(["USDC", "USDT", "ETH", "USDC"]),
        chain: pick(["base", "ethereum", "arbitrum", "polygon"]),
        acceptsOffers: true,
        acceptsMeme: Boolean(seed.meme),
        memeToken: seed.meme ?? null,
        featured: Boolean(seed.featured),
        fileName: `${slugify(seed.title)}-v1.4.2.zip`,
        fileSizeBytes: rnd(90_000_000) + 2_000_000,
        demoUrl: seed.demo ?? null,
        repoUrl: seed.repo ?? null,
        docsUrl: seed.docs ?? null,
        viewCount: rnd(18000) + 800,
        likeCount: rnd(1800) + 40,
        trendingScore: rnd(1000) / 10,
        creatorId: creator.id,
        publishedAt: new Date(Date.now() - daysAgo * 86400000),
        createdAt: new Date(Date.now() - daysAgo * 86400000),
        assets: {
          create: Array.from({ length: 4 }).map((_, k) => ({
            kind: "screenshot",
            position: k,
            alt: `${seed.title} screenshot ${k + 1}`,
            url: `https://picsum.photos/seed/${encodeURIComponent(slugify(seed.title))}${k}/1280/800`,
          })),
        },
        tags: { create: seed.tags.map((name) => ({ name })) },
      },
    });
    projects.push(p);
  }

  console.log("Creating orders, transactions, reviews-");
  let salesCount = 0;
  for (const project of projects) {
    const n = rnd(14) + 2;
    for (let i = 0; i < n; i++) {
      const buyer = pick(buyerRows);
      if (buyer.id === project.creatorId) continue;
      const daysAgo = rnd(120) + 1;
      const created = new Date(Date.now() - daysAgo * 86400000);
      const fee = Math.round(project.priceCents * 0.08);
      const order = await prisma.order.create({
        data: {
          reference: `NX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          projectId: project.id,
          buyerId: buyer.id,
          sellerId: project.creatorId,
          listPriceCents: project.priceCents,
          amountCents: project.priceCents,
          platformFeeCents: fee,
          sellerPayoutCents: project.priceCents - fee,
          currency: project.currency,
          chain: project.chain,
          memecoin: Boolean(project.memeToken),
          status: "paid",
          txHash: "0x" + Math.random().toString(16).slice(2).repeat(8).slice(0, 64),
          blockNumber: 20_000_000 + rnd(4_000_000),
          paidAt: created,
          createdAt: created,
          accessToken: Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2),
          licenseKey: `NX-${Math.random().toString(36).slice(2, 10).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        },
      });
      await prisma.transaction.createMany({
        data: [
          {
            orderId: order.id, userId: buyer.id, type: "purchase", direction: "out",
            amountCents: project.priceCents, currency: project.currency, chain: project.chain,
            txHash: order.txHash!, status: "confirmed", createdAt: created, confirmedAt: created,
          },
          {
            orderId: order.id, userId: project.creatorId, type: "sale", direction: "in",
            amountCents: order.sellerPayoutCents, currency: project.currency, chain: project.chain,
            txHash: order.txHash!, status: "confirmed", createdAt: created, confirmedAt: created,
          },
        ],
      });

      if (rnd(3) > 0) {
        const rating = pick([5, 5, 5, 4, 4, 3]);
        const titles = ["Exactly as described", "Huge time saver", "Well architected", "Solid foundation", "Worth every cent"];
        const bodies = [
          "Dropped it into our project the same afternoon. Documentation was better than expected and the code is genuinely readable.",
          "Saved me probably a week of work. The examples are production quality, not toy snippets.",
          "Support answered within a few hours. Updates keep coming. Very happy.",
          "Does what it says. A couple of docs could go deeper but nothing blocking.",
          "Solid foundation. I extended it with a custom adapter within an hour.",
        ];
        await prisma.review.create({
          data: {
            projectId: project.id,
            orderId: order.id,
            authorId: buyer.id,
            rating,
            title: pick(titles),
            body: pick(bodies),
            helpful: rnd(24),
            createdAt: created,
          },
        });
      }
      salesCount++;
    }
  }

  console.log("Computing aggregates-");
  for (const p of projects) {
    const agg = await prisma.order.aggregate({
      where: { projectId: p.id, status: "paid" },
      _count: { _all: true },
      _sum: { sellerPayoutCents: true },
    });
    const rev = await prisma.review.aggregate({ where: { projectId: p.id }, _avg: { rating: true }, _count: { _all: true } });
    const avg = rev._avg.rating ?? 0;
    await prisma.project.update({
      where: { id: p.id },
      data: {
        saleCount: agg._count._all,
        ratingAvg: Math.round(avg * 10) / 10,
        ratingCount: rev._count._all,
      },
    });
    await prisma.user.update({
      where: { id: p.creatorId },
      data: { totalEarningsCents: { increment: agg._sum.sellerPayoutCents ?? 0 } },
    });
  }

  console.log("Follows + likes + analytics-");
  for (const u of [...creatorRows, ...buyerRows]) {
    for (const c of [...creatorRows, ...buyerRows]) {
      if (u.id !== c.id && rnd(10) > 6) {
        await prisma.follow.create({ data: { followerId: u.id, followingId: c.id } }).catch(() => {});
      }
    }
  }
  for (const p of projects) {
    for (const u of [...creatorRows, ...buyerRows]) {
      if (rnd(10) > 7) {
        await prisma.projectLike.create({ data: { userId: u.id, projectId: p.id } }).catch(() => {});
      }
    }
  }

  const events = [];
  for (const p of projects) {
    for (let i = 0; i < 220; i++) {
      const d = new Date(Date.now() - rnd(30) * 86400000 - rnd(86400000));
      events.push({
        type: pick(["view", "view", "view", "click", "share", "like"]),
        projectId: p.id,
        path: `/p/${p.slug}`,
        sessionId: Math.random().toString(36).slice(2, 12),
        createdAt: d,
      });
    }
  }
  await prisma.analyticsEvent.createMany({ data: events });

  console.log(`\nâœ… Seed complete: ${creatorRows.length} creators, ${buyerRows.length} buyers, ${projects.length} projects, ${salesCount} sales.`);
  console.log("   Login: demo@nexus.dev / password123  (buyer)");
  console.log("   Login: nova@nexus.dev / password123  (creator)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });