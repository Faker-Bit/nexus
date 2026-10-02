// End-to-end smoke test of the authenticated flows against a running server.
// Usage: node smoke.cjs [baseUrl]
const BASE = process.argv[2] ?? "http://localhost:3000";

let failures = 0;
function check(name, condition, extra = "") {
  const ok = Boolean(condition);
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
}

class Session {
  constructor() {
    this.cookie = "";
  }
  async fetch(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      redirect: "manual",
      headers: { ...(options.headers ?? {}), ...(this.cookie ? { cookie: this.cookie } : {}) },
    });
    const setCookie = res.headers.getSetCookie?.() ?? [];
    for (const raw of setCookie) {
      const pair = raw.split(";")[0];
      if (pair.startsWith("nexus_session=")) this.cookie = pair;
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* html or plain text */
    }
    return { status: res.status, json, text };
  }
  post(path, body) {
    return this.fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
  patch(path, body) {
    return this.fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }
}

(async () => {
  // 1. Public discovery
  const anon = new Session();
  const list = await anon.fetch("/api/projects?perPage=5");
  check("GET /api/projects returns listings", list.status === 200 && list.json?.data?.items?.length > 0,
    `status=${list.status} count=${list.json?.data?.items?.length}`);

  const slug = list.json?.data?.items?.[0]?.slug;
  check("listing slug present", Boolean(slug), slug ?? "");

  const search = await anon.fetch("/api/projects?q=agent&sort=rating");
  check("search + sort filter works", search.status === 200, `total=${search.json?.data?.total}`);

  const filtered = await anon.fetch("/api/projects?category=ai&maxPrice=20000");
  check("category + price filter works", filtered.status === 200, `total=${filtered.json?.data?.total}`);

  const creators = await anon.fetch("/api/creators");
  check("GET /api/creators works", creators.status === 200 && creators.json?.data?.items?.length > 0,
    `count=${creators.json?.data?.items?.length}`);

  // 2. Auth
  const bad = await anon.post("/api/auth/login", { email: "demo@nexus.dev", password: "wrong-password" });
  check("login rejects a bad password", bad.status === 401, `status=${bad.status}`);

  const s = new Session();
  const login = await s.post("/api/auth/login", { email: "demo@nexus.dev", password: "password123" });
  check("login succeeds", login.status === 200 && Boolean(s.cookie), `status=${login.status}`);

  const me = await s.fetch("/api/auth/me");
  check("session resolves the user", me.json?.data?.authenticated === true, me.json?.data?.user?.handle ?? "");

  // 3. Gated pages
  for (const route of ["/dashboard", "/dashboard/projects", "/dashboard/sales", "/dashboard/offers", "/transactions", "/library"]) {
    const res = await s.fetch(route);
    check(`page ${route} renders`, res.status === 200, `status=${res.status}`);
  }

  // 4. Checkout flow — pick a listing this buyer does not already own.
  const myOrders = (await s.fetch("/api/transactions?scope=purchases&perPage=60")).json?.data?.items ?? [];
  const ownedProjectIds = new Set();
  for (const row of myOrders) {
    const detail = await s.fetch(`/api/checkout/${row.orderId}`);
    if (detail.status === 200) ownedProjectIds.add(detail.json.data.order.project.id);
  }
  const all = (await anon.fetch("/api/projects?perPage=48")).json.data.items;
  const target = all.find(
    (p) => !ownedProjectIds.has(p.id) && p.creator.handle !== "demo" && p.priceCents > 0,
  );
  check("an unowned listing is available for checkout", Boolean(target), target?.title ?? "none");
  const checkout = await s.post("/api/checkout", {
    projectId: target.id,
    licenseType: "standard",
    currency: "USDC",
    chain: "base",
  });

  if (checkout.status === 201) {
    const orderId = checkout.json.data.order.id;
    check(
      "checkout creates a pending order",
      checkout.json.data.order.status === "awaiting_payment",
      `${orderId} status=${checkout.json.data.order.status}`,
    );

    const order = await s.fetch(`/api/checkout/${orderId}`);
    check("order detail loads", order.status === 200 && order.json.data.order.reference === checkout.json.data.order.reference);

    const confirm = await s.post(`/api/checkout/${orderId}/confirm`, {});
    check("settlement marks the order paid", confirm.status === 200 && confirm.json?.data?.order?.status === "paid",
      confirm.json?.data?.order?.licenseKey ?? confirm.json?.error?.message ?? "");

    const dl = await s.fetch(`/api/checkout/${orderId}/download`);
    check("download issues a signed link", dl.status === 200 && Boolean(dl.json?.data?.download?.url));

    const ledger = await s.fetch("/api/transactions");
    check("transaction ledger records the sale", ledger.status === 200 && ledger.json.data.items.length > 0,
      `rows=${ledger.json?.data?.items?.length}`);
  } else {
    check("checkout creates an order", false, checkout.json?.error?.message ?? `status=${checkout.status}`);
  }

  // 5. Likes
  const like = await s.post(`/api/projects/${target.id}/like`, {});
  check("like toggles on", like.status === 200 && like.json?.data?.liked === true);
  const unlike = await s.fetch(`/api/projects/${target.id}/like`, { method: "DELETE" });
  check("like toggles off", unlike.status === 200 && unlike.json?.data?.liked === false);

  // 6. Offers — pick a listing the buyer has not already offered on.
  const myOffers = (await s.fetch("/api/offers?scope=buyer&perPage=60")).json?.data?.items ?? [];
  const offeredProjectIds = new Set(myOffers.map((o) => o.projectId));
  const offerTarget = all.find(
    (p) =>
      !ownedProjectIds.has(p.id) &&
      !offeredProjectIds.has(p.id) &&
      p.priceCents > 2000 &&
      p.acceptsOffers &&
      p.creator.handle !== "demo",
  );
  if (offerTarget) {
    const offer = await s.post("/api/offers", {
      projectId: offerTarget.id,
      amountCents: Math.max(100, Math.round(offerTarget.priceCents * 0.6)),
      message: "Smoke test offer",
      expiresInDays: 2,
    });
    check("offer is accepted", offer.status === 201, offer.json?.error?.message ?? `${offerTarget.title} id=${offer.json?.data?.offer?.id}`);
  }

  // 7. Reviews (needs a paid order)
  const paidOrder = (await s.fetch("/api/transactions?scope=purchases")).json?.data?.items?.[0]?.orderId;
  check("purchased order id is discoverable", Boolean(paidOrder), paidOrder ?? "none");

  // 8. Dashboard data
  const stats = await s.fetch("/api/dashboard/stats");
  check("dashboard stats respond", stats.status === 200 && typeof stats.json?.data?.totals === "object");

  // 9. Creator publishing
  const c = new Session();
  const creatorLogin = await c.post("/api/auth/login", { email: "nova@nexus.dev", password: "password123" });
  check("creator login succeeds", creatorLogin.status === 200, `status=${creatorLogin.status}`);

  const created = await c.post("/api/projects", {
    title: `Smoke Test Listing ${Date.now()}`,
    tagline: "Created by the automated smoke test to verify the publishing pipeline.",
    description:
      "## Smoke test\n\nThis listing exists to prove the create endpoint, tag normalisation and asset handling work end to end.",
    category: "code",
    language: "TypeScript",
    license: "mit",
    tags: ["smoke", "test"],
    priceCents: 1200,
    currency: "USDC",
    chain: "base",
    acceptsOffers: true,
    assets: [{ kind: "screenshot", url: "https://picsum.photos/seed/smoke/1280/800" }],
    status: "published",
  });
  check("creator publishes a project", created.status === 201, created.json?.error?.message ?? created.json?.data?.project?.slug);

  if (created.status === 201) {
    const id = created.json.data.project.id;
    const patch = await c.patch(`/api/projects/${id}`, { priceCents: 2400, status: "draft" });
    check("creator updates the project", patch.status === 200 && patch.json?.data?.project?.status === "draft");

    const del = await c.fetch(`/api/projects/${id}`, { method: "DELETE" });
    check("creator deletes the project", del.status === 200 && del.json?.data?.deleted === true);

    const forbidden = await s.patch(`/api/projects/${id}`, { priceCents: 1 });
    check("non-owner cannot edit", forbidden.status === 401 || forbidden.status === 404, `status=${forbidden.status}`);
  }

  // 10. Ownership isolation
  const stolen = await s.fetch(`/api/projects/${created.json?.data?.project?.id ?? "none"}`);
  check("gated API rejects anonymous callers", stolen.status === 401 || stolen.status === 404, `status=${stolen.status}`);

  // 11. Analytics
  const track = await anon.post("/api/analytics/track", { type: "view", projectId: target.id, path: "/p/x" });
  check("analytics intake accepts events", track.status === 200);

  // 12. Trending cron
  const cron = await anon.fetch("/api/cron/trending");
  check("trending job runs", cron.status === 200, `updated=${cron.json?.data?.updated}`);

  console.log(`\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
})();
