// What a browser actually downloads for a page: every asset the HTML references,
// with its real compressed size — the number that drives LCP/FCP on a real network.
const http = require("node:http");
const zlib = require("node:zlib");

// Deliberately NOT 3000: the audit harness must never collide with `npm run dev`.
//   Start one yourself on the port you want, or run the npm scripts below.
const BASE = process.env.BASE ?? "http://localhost:3100";
const ROUTES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/", "/explore", "/p/helix-agent-runtime", "/pricing", "/terms", "/dashboard"];

function get(url, { brotli = false } = {}) {
  return new Promise((resolve, reject) => {
    const headers = { "Accept-Encoding": brotli ? "br, gzip" : "gzip" };
    http
      .get(url, { headers }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks);
          const enc = res.headers["content-encoding"];
          let decoded = raw;
          try {
            if (enc === "gzip") decoded = zlib.gunzipSync(raw);
            else if (enc === "br") decoded = zlib.brotliDecompressSync(raw);
          } catch {
            decoded = raw;
          }
          // `raw` is what actually crosses the network; `decoded` is what we parse.
          resolve({ status: res.statusCode, decoded, wire: raw.length, type: res.headers["content-type"] ?? "" });
        });
      })
      .on("error", reject);
  });
}

const ASSET_RE = /(?:href|src)="(\/_next\/[^"]+)"/g;
const PRELOAD_RE = /<link[^>]+rel="preload"[^>]*>/g;
// `noModule` scripts are never fetched by modern browsers.
const NO_MODULE_RE = /<script[^>]*noModule[^>]*src="([^"]+)"[^>]*>/g;
const SCRIPT_RE = /<script[^>]*src="([^"]+)"[^>]*>/g;

function classify(url) {
  if (url.includes("/media/") && url.includes(".woff2")) return "font";
  if (url.includes(".css")) return "css";
  if (url.includes("/chunks/app/")) return "js (page)";
  if (url.includes("/chunks/")) return "js (shared)";
  if (url.includes("polyfills")) return "js (polyfill)";
  if (url.includes("/_next/image")) return "image (optimised)";
  return "other";
}

(async () => {
  console.log("route".padEnd(28) + "html".padStart(8) + "css".padStart(8) + "js".padStart(8) + "font".padStart(8) + "img".padStart(8) + "reqs".padStart(6) + "TOTAL".padStart(9));
  console.log("-".repeat(85));

  for (const route of ROUTES) {
    const page = await get(BASE + route);
    const html = page.decoded.toString("utf8");

    const skipped = new Set([...html.matchAll(NO_MODULE_RE)].map((m) => m[1]));

    const urls = new Set();
    for (const m of html.matchAll(ASSET_RE)) urls.add(m[1]);
    for (const m of html.matchAll(SCRIPT_RE)) urls.add(m[1]);
    const preloads = [...html.matchAll(PRELOAD_RE)].map((m) => (m[0].match(/href="([^"]+)"/) ?? [])[1]).filter(Boolean);
    for (const p of preloads) if (p.startsWith("/_next")) urls.add(p);
    for (const s of skipped) urls.delete(s);

    const totals = { font: 0, css: 0, "js (page)": 0, "js (shared)": 0, "js (polyfill)": 0, "image (optimised)": 0, other: 0 };
    let htmlKb = page.wire / 1024;
    let count = 1;

    for (const url of urls) {
      const asset = await get(BASE + url, { brotli: true });
      if (asset.status >= 400) continue;
      const kind = classify(url);
      totals[kind] = (totals[kind] ?? 0) + asset.wire / 1024;
      count++;
    }

    const js =
      totals["js (page)"] + totals["js (shared)"] + totals["js (polyfill)"];
    const total =
      htmlKb + totals.css + js + totals.font + totals["image (optimised)"] + totals.other;

    console.log(
      route.padEnd(28) +
        htmlKb.toFixed(0).padStart(8) +
        totals.css.toFixed(0).padStart(8) +
        js.toFixed(0).padStart(8) +
        totals.font.toFixed(0).padStart(8) +
        totals["image (optimised)"].toFixed(0).padStart(8) +
        String(count).padStart(6) +
        total.toFixed(0).padStart(9),
    );
  }
})();