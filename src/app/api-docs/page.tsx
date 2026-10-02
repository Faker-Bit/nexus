import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHeader } from "@/components/ui/section";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/docs/code-block";

export const metadata: Metadata = {
  title: "API reference",
  description: "HTTP API for the NEXUS marketplace: discovery, checkout, offers, reviews and analytics.",
};

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/projects",
    auth: "public",
    summary: "Search and filter the marketplace.",
    params: [
      { name: "q", type: "string", desc: "Free-text query across title, tags, stack and creator." },
      { name: "category", type: "string", desc: "ai | bot | app | website | code | script | template | plugin" },
      { name: "sort", type: "string", desc: "trending | newest | price-asc | price-desc | rating | best-selling | updated" },
      { name: "minPrice / maxPrice", type: "integer", desc: "Price bounds in cents." },
      { name: "language / license / tags", type: "string", desc: "Facet filters; tags accepts a comma list." },
      { name: "featured / free / minRating", type: "boolean|number", desc: "Boolean and rating filters." },
      { name: "page / perPage", type: "integer", desc: "Defaults 1 and 12; perPage caps at 48." },
    ],
    response: `{
  "ok": true,
  "data": {
    "items": [ { "id": "...", "slug": "helix-agent-runtime", "priceCents": 24900 } ],
    "total": 18,
    "page": 1,
    "pages": 2,
    "categoryCounts": { "ai": 4, "bot": 2 }
  }
}`,
  },
  {
    method: "GET",
    path: "/api/projects/:id",
    auth: "public",
    summary: "Full listing: description, assets, tags, creator and counters. Records a view.",
    response: `{ "ok": true, "data": { "project": { "assets": [], "tags": [], "creator": {} } } }`,
  },
  {
    method: "POST",
    path: "/api/projects",
    auth: "creator",
    summary: "Publish a listing. Validated with zod; tag and asset rows are replaced atomically.",
    request: `{
  "title": "Helix Agent Runtime",
  "tagline": "Production agent runtime with tool-calling-",
  "description": "## What it does\\n-",
  "category": "ai",
  "tags": ["agents", "runtime"],
  "priceCents": 24900,
  "currency": "USDC",
  "chain": "base",
  "acceptsOffers": true,
  "assets": [{ "kind": "screenshot", "url": "https://-/shot-01.png" }]
}`,
  },
  {
    method: "PATCH",
    path: "/api/projects/:id",
    auth: "owner",
    summary: "Partial update. Only the creator may edit; slug collisions are rejected.",
  },
  {
    method: "DELETE",
    path: "/api/projects/:id",
    auth: "owner",
    summary: "Removes a project with no orders. With orders it archives instead, preserving buyer access.",
  },
  {
    method: "POST",
    path: "/api/projects/:id/like",
    auth: "session",
    summary: "Idempotent like toggle. Returns authoritative counts so clients can reconcile.",
    response: `{ "ok": true, "data": { "liked": true, "likeCount": 1841 } }`,
  },
  {
    method: "POST",
    path: "/api/checkout",
    auth: "session",
    summary: "Creates an order in awaiting_payment plus a payment intent. Rejects self-purchases and duplicate ownership.",
    request: `{
  "projectId": "clx-",
  "licenseType": "standard | extended | source",
  "currency": "USDC",
  "chain": "base",
  "memecoin": "PEPE",
  "offerId": "clx-"
}`,
    response: `{
  "ok": true,
  "data": {
    "order": { "id": "clx-", "reference": "NX-4F2A91B0", "status": "awaiting_payment" },
    "intent": { "id": "pi_-", "requiredConfirmations": 2, "networkLabel": "base · USD Coin" },
    "provider": "mock"
  }
}`,
  },
  {
    method: "POST",
    path: "/api/checkout/:orderId/confirm",
    auth: "buyer",
    summary: "Settles the intent, then atomically marks the order paid, mints a licence key, increments counters and notifies the seller.",
  },
  {
    method: "GET",
    path: "/api/checkout/:orderId/download",
    auth: "buyer",
    summary: "Issues a signed, audited download. Respects maxDownloads and records the IP hash.",
  },
  {
    method: "POST",
    path: "/api/offers",
    auth: "session",
    summary: "Creates an offer below the list price. One open offer per buyer per project.",
    request: `{ "projectId": "clx-", "amountCents": 17000, "message": "Only need the core module", "expiresInDays": 3 }`,
  },
  {
    method: "POST",
    path: "/api/offers/:id/respond",
    auth: "seller",
    summary: "Accept (locks the price, opens checkout) or decline. Expired offers cannot be accepted.",
  },
  {
    method: "POST",
    path: "/api/reviews",
    auth: "buyer",
    summary: "One review per order. Recomputes the project rating average and bumps creator reputation.",
  },
  {
    method: "GET",
    path: "/api/transactions",
    auth: "session",
    summary: "Unified ledger for the signed-in user. Scope by purchases, sales or all.",
  },
  {
    method: "POST",
    path: "/api/analytics/track",
    auth: "public",
    summary: "First-party event intake. No third-party pixels; the session is a salted hash of the request IP.",
  },
  {
    method: "POST",
    path: "/api/auth/wallet/nonce",
    auth: "public",
    summary: "Issues an EIP-4361 style message + nonce for wallet sign-in.",
  },
  {
    method: "POST",
    path: "/api/auth/wallet/verify",
    auth: "public",
    summary: "Recovers the address from the signature, verifies it, links or creates the account, sets the session cookie.",
  },
];

export default function ApiDocsPage() {
  return (
    <Container className="pb-24">
      <PageHeader
        eyebrow="Developers"
        title="API reference"
        description="Everything the storefront does over HTTP, in the order it happens. Responses are always { ok, data } or { ok: false, error }."
      />

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Badge tone="neon">JSON only</Badge>
        <Badge tone="glass">Cookie sessions (httpOnly, SameSite=Lax)</Badge>
        <Badge tone="glass">Zod validation on every write</Badge>
        <Badge tone="glass">Per-scope rate limits</Badge>
      </div>

      <div className="space-y-4">
        {ENDPOINTS.map((endpoint) => (
          <section key={endpoint.path + endpoint.method} className="glass overflow-hidden rounded-2xl">
            <header className="flex flex-wrap items-center gap-3 border-b border-white/8 px-5 py-4">
              <span
                className={`rounded-md px-2 py-1 font-mono text-[11px] font-semibold ${
                  endpoint.method === "GET"
                    ? "bg-neon-400/14 text-neon-200"
                    : endpoint.method === "POST"
                      ? "bg-mint/14 text-mint"
                      : endpoint.method === "DELETE"
                        ? "bg-rose-400/14 text-rose-200"
                        : "bg-amber-400/14 text-amber"
                }`}
              >
                {endpoint.method}
              </span>
              <code className="font-mono text-[13px] text-mist-100">{endpoint.path}</code>
              <Badge size="sm" tone={endpoint.auth === "public" ? "neutral" : "violet"}>
                {endpoint.auth}
              </Badge>
            </header>
            <div className="space-y-4 px-5 py-4">
              <p className="text-[13.5px] text-mist-300">{endpoint.summary}</p>

              {endpoint.params ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-[12.5px]">
                    <thead className="text-[10.5px] uppercase tracking-wider text-mist-500">
                      <tr>
                        <th className="pb-2 pr-4 font-medium">Parameter</th>
                        <th className="pb-2 pr-4 font-medium">Type</th>
                        <th className="pb-2 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoint.params.map((p) => (
                        <tr key={p.name} className="border-t border-white/5">
                          <td className="py-2 pr-4 font-mono text-mist-200">{p.name}</td>
                          <td className="py-2 pr-4 text-mist-500">{p.type}</td>
                          <td className="py-2 text-mist-400">{p.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {endpoint.request ? (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-mist-500">Request</p>
                  <CodeBlock code={endpoint.request} />
                </div>
              ) : null}

              {endpoint.response ? (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-mist-500">Response</p>
                  <CodeBlock code={endpoint.response} />
                </div>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-[12.5px] text-mist-500">
        Questions about an endpoint?{" "}
        <Link href="/about" className="text-neon-300 hover:text-neon-200">
          Read the design notes
        </Link>{" "}
        or browse{" "}
        <Link href="/explore" className="text-neon-300 hover:text-neon-200">
          the marketplace
        </Link>
        .
      </p>
    </Container>
  );
}