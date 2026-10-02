# NEXUS

A premium Web3 marketplace where developers and creators showcase, share and sell what they build - agents, bots, apps, templates, scripts and datasets. Neon-green interface, WebGL throughout, crypto and memecoin settlement, and a backend designed to stay clean as it grows.

```
npm run setup     # prisma generate + db push + seed
npm run dev       # http://localhost:3000
```

Seeded logins:

| Role   | Email              | Password      |
| ------ | ------------------ | ------------- |
| Buyer  | `demo@nexus.dev`   | `password123` |
| Creator| `nova@nexus.dev`   | `password123` |

---

## What is here

**Visual system**

- Neon-green identity: spring green primary (`#00ff9d`), jade secondary, lime highlight, one cool
  cyan outlier for contrast. Gold is reserved for ratings and memecoin rails; red only for errors.
- Every surface, token and gradient derives from the `@theme` block in `globals.css` — one place to
  retune the whole product.

**Storefront**

- Landing page with a WebGL hero — instanced particle field, floating PBR geometry, bloom,
  chromatic aberration and vignette, driven by pointer and scroll.
- Discovery with debounced search, category chips, a filter rail (price, rating, stack, licence,
  tags), seven sort modes, and cursor-tilting project cards with spotlight tracking.
- Project pages: gallery + lightbox, Markdown description with a safe renderer, licence and stack
  facts, demo/repo/docs links, file spec, rating histogram, verified-purchase reviews.
- Creator profiles with reputation ring, rating breakdown, follower counts and top tags.
- Checkout with licence tiers, currency/network selection, memecoin opt-in and a staged
  progress rail; library and a verifiable transaction ledger.

**Commerce**

- Email + password auth (bcrypt cost 12) and EIP-4361-style wallet sign-in with server-side
  signature recovery.
- Offers: buyers negotiate below list price, creators accept (which locks the price and opens a
  30-minute checkout) or decline.
- Orders move `pending → awaiting_payment → paid`; access tokens are minted **only** after the
  payment provider confirms settlement.
- Downloads are signed, counted, IP-hashed and logged per licence.
- Reviews require a settled order, recompute the project rating, and bump creator reputation.

**Creator tooling**

- Five-step upload wizard (basics → media → delivery → pricing → review) with tag normalisation,
  asset management, licence tiers and draft/publish control.
- Dashboard with revenue and traffic charts, catalogue mix, conversion, listing health, recent
  sales and an activity feed.
- Sales ledger, offers inbox, profile/payout/wallet settings.

---

## Stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router, RSC, route handlers, middleware)       |
| Language   | TypeScript, strict                                            |
| Styling    | Tailwind CSS v4 with a custom `@theme` + `@utility` design system |
| 3D         | three.js + @react-three/fiber + drei + @react-three/postprocessing |
| Motion     | Framer Motion                                                 |
| Charts     | Recharts                                                     |
| Data       | Prisma 6 + SQLite (Postgres-portable schema)                  |
| Validation | Zod on every write                                            |
| Auth       | `jose` JWT in httpOnly cookies, bcrypt hashes                  |
| Wallet     | `viem` signature recovery, EIP-1193 provider adapter           |
| Payments   | Provider interface in `src/lib/payments` (mock + EVM seam)    |

---

## Architecture notes

**Server-first rendering.** Pages are server components that query Prisma directly and hand plain,
serialisable props to small client islands (cards, buy box, wizard, charts). No component
functions or React elements cross the RSC boundary — icons are referenced by name and resolved
inside the client bundle.

**Domain constants live in TypeScript.** Prisma enums are stored as validated strings
(`src/lib/constants.ts`), so the identical schema runs on SQLite locally and Postgres in
production with no model changes.

**Payments are pluggable.** `src/lib/payments/provider.ts` defines the `PaymentsProvider`
interface. The shipped `mock` provider reproduces the shape of an on-chain transfer — tx hash,
block number, confirmation counting, expiry — without touching a chain, so checkout, the order
state machine, ledger and analytics are exercised end to end. Set `PAYMENTS_PROVIDER=evm` (or
point it at a relayer) and nothing outside that folder changes.

**Escrowed delivery.** An order is created in `awaiting_payment` with no access token minted
client-side; `/api/checkout/:id/confirm` marks it paid inside a transaction that also increments
counters, credits the seller, converts the offer and notifies them. Downloads require a paid
order and a matching token.

**Security.**

- httpOnly, SameSite cookies; session JWTs signed with HS256 and validated at the edge in
  `middleware.ts` so private pages never flash.
- Zod validation on every write, with per-scope rate limits and per-account login throttling.
- Password policy screening, suspended-account checks, failed-login counters.
- Security headers (nosniff, DENY frames, strict referrer, HSTS, restrictive permissions policy).
- Markdown rendered through an allow-list — creator-supplied HTML is never injected.
- Downloads hashed against a salted IP, never served from public storage.
- Creator-only writes enforce ownership server-side; projects with orders archive instead of
  delete so buyers keep access.

**Performance.**

- The hero canvas is dynamically imported with `ssr: false`, gated behind an intersection
  observer, and its render loop stops when it scrolls out of view.
- `prefers-reduced-motion` disables 3D entirely and collapses transitions.
- Route-level caching: landing/explore 30–60s ISR, dashboards `force-dynamic`.
- Images go through `next/image` with a remote allow-list.

**Analytics are first-party.** Events go to our own table; the session identifier is a salted
SHA-256 of the request IP. No third-party pixels, no cross-site tracking.

---

## 3D and motion

Seven WebGL scenes, all sharing one design language and all mounted only while visible.

| Scene           | Where                    | What it is                                                    |
| --------------- | ------------------------ | ------------------------------------------------------------- |
| `HeroScene`     | Landing hero             | Particle field, floating iridescent geometry, orbit rings, bloom |
| `WaveGridScene` | Explore header, landing categories, dashboard | Displaced wireframe terrain with additive crest shading |
| `GalaxyScene`   | Creator profiles, 404, landing creators | Three-arm spiral of point sprites with a hot core      |
| `CoinCoreScene` | Pricing hero             | Faceted core with orbiting rings and tetrahedral shards       |
| `AuroraScene`   | Payout section, about    | Flowing shader curtains with shimmer and parallax             |
| `KnotFieldScene`| Landing CTA              | Interlocked torus knots over drifting shapes                  |
| `ParticleBurst` | Checkout success         | Radial celebration burst that fires once on settlement         |
| `SculptureScene`| Project page preview     | Seeded generative lattice, deterministic per listing           |

Motion layer:

- `RevealText` word-by-word blur-up headings; `Reveal` / `Stagger` for everything else.
- `Parallax` and `ScrollScale` for scroll-linked depth.
- `Magnetic` buttons that lean toward the cursor.
- `PageTransition` in `app/template.tsx` — a blurred enter transition on every navigation.
- `ScrollProgress` (spring-damped bar) and `CursorGlow` (transform-only pointer light).
- Card choreography: 3D tilt, cursor spotlight, specular sweep, neon rim bloom, hover lift.

**Performance rules for the 3D layer**

- `SceneZone` mounts a canvas only while it intersects the viewport (with a generous margin) and
  unmounts it again, so a multi-scene page never holds more than a couple of GPU contexts.
- `SceneCanvas` caps DPR at 1.5, uses ACES tone mapping, and shares one bloom/vignette composer.
- `prefers-reduced-motion` removes every scene, every transition and the cursor light.
- All shader uniforms are refs mutated in `useFrame` — no React state per frame.

---

## Performance

The performance rules the app is actually built around, and the measurements that motivated them.

### Numbers

| Route | Initial JS (gzip) | Transferred (compressed) | LCP desktop | LCP mobile (4x CPU / 10 Mbps) |
| --- | --- | --- | --- | --- |
| `/` | 526 → **188 kB** | 751 → **65 kB** | 472 → **244 ms** FCP | never went idle → **220 ms** |
| `/explore` | 528 → **190 kB** | 49 → **33 kB** | 884 → **328 ms** | 1564 → 1608 ms |
| `/p/[slug]` | 531 → **193 kB** | 221 → **36 kB** | 2600 → **428 ms** | 1632 → 1700 ms |
| `/dashboard` | 627 → **169 kB** | — | — | — |
| `/terms` | 152 kB | 22 → **20 kB** | 192 → 196 ms | 1168 → 1192 ms |

Total first-load JS across all 31 routes: **8764 → 5145 kB gzip (−41%)**.
CLS stays at ≤ 0.0008 everywhere; TTFB is 11–43 ms.

### The rules

**The 3D stack never touches the critical path.** three.js, R3F, drei and postprocessing live
only inside `scene-host.tsx`, which is reached through `dynamic()`. Pages pass a scene *name*
(`"wave" | "galaxy" | "coin" | …`), never a component, so the server module graph never pulls
the library in. A scene additionally waits for two animation frames **and** an idle callback
before it mounts, so it cannot compete with FCP or LCP. Result: 185 kB gzip of three.js is
fetched after the page is interactive instead of blocking it.

**The charting library is deferred too.** recharts (118 kB gzip) sits behind `LazyChart`, which
mounts it only when the chart scrolls near. Stat cards and sparklines are plain SVG.

**Device-aware rendering.** Both canvases drop to DPR 1 and a much smaller particle budget on
`pointer: coarse` or ≤ 4 cores.

**Caching, by sensitivity.** Hashed build output, fonts and optimised images get
`max-age=31536000, immutable`. Public read APIs (`/api/projects`, `/api/creators`) get
`s-maxage` + `stale-while-revalidate` so a CDN serves them. Everything touching a session —
checkout, transactions, dashboard, profile, wallets, orders, auth, offers, reviews — is
`private, no-store`.

**Reads are cached in production, not just dev.** `lib/db.ts#cached` wraps `unstable_cache` with
tags in production and a process-local map in development. View counting and analytics writes
run through `after()`, so they never sit in front of TTFB.

**Indexes match the query shapes.** Every list route filters on `status` and then sorts on a
specific column, so each sort mode has a matching composite index
(`[status, trendingScore]`, `[status, priceCents]`, `[status, saleCount]`, …). Relation scalars
that Prisma does not index by default — `Transaction.orderId`, in particular — are indexed.

**Images.** AVIF with WebP fallback (27 kB vs 204 kB on the same hero shot), a trimmed
breakpoint ladder so the optimiser's cache actually hits, explicit `fetchPriority="high"` on the
one image that can be the LCP element, and lazy loading everywhere else.

**Rendering.** Below-the-fold sections use `content-visibility: auto` with a reserved intrinsic
size, so the browser skips layout and paint for content nobody is looking at while the scrollbar
stays stable. `ProjectCard` is memoised — a landing page renders 30+ of them.

**No render on pointer movement.** The cursor glow writes transforms directly to the DOM inside
a `requestAnimationFrame`; the earlier version called `setState` on every `mousemove` and
re-rendered the tree.

**No full page reloads for navigation.** Header search uses `router.push`, so it is a client
transition rather than a document reload.

**Payload hygiene.** `toCardData` returns only the fields a card, rail or buy box actually
reads, so the RSC payload and every API response stay small.

### Measuring it

The measurement harness runs on **port 3100**, never 3000, so `npm run dev` can stay up at the same
time. It builds, starts a server on 3100, measures, and shuts it down again.

```bash
npm run dev            # :3000, your app
npm run perf           # build -> serve :3100 -> measure -> stop (never touches :3000)
npm run perf:serve     # just leave a server running on :3100, for iterating by hand

npm run perf:bundle    # per-route JS, gzip + brotli        (reads .next, no server)
npm run perf:deferred  # what is still fetched after first paint
npm run perf:wire      # bytes a browser downloads, per route (needs a server)
npm run perf:vitals    # Chrome via CDP: TTFB/FCP/LCP/CLS/TBT, median of 3 (needs a server)
npm run smoke          # 32 end-to-end API checks
```

If you ever hit `EADDRINUSE` on 3000, something outside these scripts is holding it:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object OwningProcess
Get-CimInstance Win32_Process -Filter "ProcessId = <pid>" | Select-Object CommandLine
```

### Known headroom

- **framer-motion is ~50 kB gzip of the ~148 kB shared floor**, loaded on every route because the
  header dropdown, mobile menu and route bar animate with it. It is used across 21 files;
  converting to `LazyMotion` + `m` would save roughly half of it, at the cost of the shared
  layout animations and layout-id transitions. Deliberately not taken — see git history for the
  trade-off if you want it revisited.
- **first-visit image cost.** The Next optimiser fetches and encodes remote covers on a cold
  cache, which dominates LCP on a project page's very first load. Moving covers to pre-encoded
  AVIF at upload time (or an image CDN) removes it entirely.
- **`content-visibility` on the explore filter rail** would cut hydration work on phones by ~30
  inputs, but a `useMediaQuery` gate makes the rail pop in after hydration on desktop. Left as
  CSS-hidden so the visual result is identical.

---

## Deploying to Vercel

### What had to change, and why

| Problem | Fix |
| --- | --- |
| Vercel's filesystem is ephemeral and read-only, so SQLite cannot persist | The schema now targets **PostgreSQL**. `scripts/db-provider.mjs` rewrites the one `provider` line from `DATABASE_URL` on `predev`, `prebuild` and `postinstall` — `file:…` → `sqlite` locally, anything else → `postgresql` in production. One schema, both environments, no manual step. |
| Prisma has no migration history | `prisma/migrations/20261002130000_init` holds the PostgreSQL migration, generated with `migrate diff` so it needs no live database. Production uses `prisma migrate deploy`; local dev keeps using `db push`. |
| The query engine is not present in the Vercel lambda | `binaryTargets` now lists `rhel-openssl-3.0.x` and `debian-openssl-3.0.x`. |
| Serverless opens a connection per cold start | `lib/db.ts` warns at boot if `DATABASE_URL` has no pooler marker. Use a pooled URL. |
| `prisma` seed config deprecated | Moved to `prisma.config.ts`, which also re-parses `.env` because adding that file disables Prisma's implicit loading. |
| Nightly trending had no scheduler | `vercel.json` registers a Vercel Cron for `/api/cron/trending`. |
| `jose` pulled `CompressionStream` into Edge middleware (build warning + dead code) | Middleware runs on the Node.js runtime now. Warning gone, crypto consistent across the app. |
| No reference for required environment variables | `.env.example` documents every variable. |

### Steps

**1. Create a Postgres database.** Vercel Postgres, Neon or Supabase all work. Use the **pooled**
connection string — Neon: append `?pgbouncer=true&sslmode=require`; Supabase: use the `-pooler`
hostname with port `6543`.

**2. Import and configure.**

```bash
npm i -g vercel
vercel link
vercel env pull .env.local        # if using Vercel Postgres integration
```

Set these in the Vercel dashboard (Production + Preview):

```
DATABASE_URL         postgresql://...pooled...
AUTH_SECRET          <node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))">
NEXT_PUBLIC_APP_URL  https://your-app.vercel.app
PAYMENTS_PROVIDER    mock
DEFAULT_CHAIN        base
PLATFORM_FEE_BPS     800
```

`DATABASE_URL` must also be available at **build** time: several routes are pre-rendered or ISR and
query the database while building.

**3. Apply the migration and seed** (run once, locally against the production URL):

```bash
DATABASE_URL="postgresql://..." npm run db:deploy
DATABASE_URL="postgresql://..." npm run db:seed
```

**4. Deploy.**

```bash
vercel --prod
```

### After deploying

- Point `NEXT_PUBLIC_APP_URL` at the real origin so metadata and absolute URLs are correct.
- `vercel.json` schedules `/api/cron/trending` daily at 03:00 UTC. Vercel Cron cannot send an
  `x-cron-secret` header, so leave `CRON_SECRET` unset and rely on the platform schedule; set it only
  if you also trigger the job by hand.
- Delivered archives still resolve to a generated licence manifest until object storage is wired up
  (`FILES_S3_*` in `.env.example`). Everything else — listings, checkout, wallets, reviews, the
  ledger — works against Postgres unchanged.
- Payments remain simulated with `PAYMENTS_PROVIDER=mock`. Implement `PaymentsProvider` and flip the
  env var to move to a real relayer.

### Local development is unchanged

```bash
npm run setup    # sqlite file, seeded
npm run dev      # :3000
```

The provider swap is automatic, so the same checkout runs both places.

---

## API

Full reference with request/response bodies lives at `/api-docs`. Highlights:

| Method | Path                            | Auth     |
| ------ | ------------------------------- | -------- |
| GET    | `/api/projects`                 | public   |
| POST   | `/api/projects`                 | creator  |
| PATCH  | `/api/projects/:id`             | owner    |
| DELETE | `/api/projects/:id`             | owner    |
| POST   | `/api/projects/:id/like`        | session  |
| POST   | `/api/checkout`                 | session  |
| POST   | `/api/checkout/:orderId/confirm`| buyer    |
| GET    | `/api/checkout/:orderId/download` | buyer  |
| POST   | `/api/offers`                   | session  |
| POST   | `/api/offers/:id/respond`       | seller   |
| POST   | `/api/reviews`                  | buyer    |
| GET    | `/api/transactions`             | session  |
| GET    | `/api/dashboard/stats`          | session  |
| POST   | `/api/analytics/track`          | public   |
| GET    | `/api/cron/trending`            | secret   |

---

## Going to production

1. **Database** — change `provider` to `postgresql`, point `DATABASE_URL` at the instance and run
   `npx prisma migrate deploy`. The schema needs no edits.
2. **Secrets** — set a 32+ byte `AUTH_SECRET`, a `CRON_SECRET` for the trending job, and a real
   `NEXT_PUBLIC_APP_URL`.
3. **Payments** — implement `PaymentsProvider` against your relayer/escrow contract and set
   `PAYMENTS_PROVIDER`.
4. **Files** — replace the manifest response in `/api/orders/[orderId]/file` with a 302 to a
   short-lived signed object-storage URL.
5. **Rate limiting** — swap the in-memory limiter in `src/lib/api.ts` for Redis.
6. **Search** — the LIKE-based discovery query is fine at seed scale; move to Postgres
   full-text or Meilisearch when the catalogue grows.

---

## Scripts

```
npm run dev         # development server
npm run build       # prisma generate + next build
npm run start       # production server
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run setup       # generate + db push + seed
npm run db:reset    # wipe, re-migrate and re-seed
npm run db:studio   # prisma studio
npm run smoke       # end-to-end API smoke test against a running server
```