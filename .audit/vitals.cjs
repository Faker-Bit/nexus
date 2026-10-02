// Median-of-N Core Web Vitals. A single cold run is dominated by JIT and cache
// variance, so every route is measured three times and the median reported.
const puppeteer = require("puppeteer-core");

const CHROME = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
// Deliberately NOT 3000: the audit harness must never collide with `npm run dev`.
//   Start one yourself on the port you want, or run the npm scripts below.
const BASE = process.env.BASE ?? "http://localhost:3100";
const RUNS = Number(process.env.RUNS ?? 3);
const MOBILE_ONLY = process.env.MOBILE === "1";
const ROUTES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["/", "/explore", "/p/helix-agent-runtime", "/pricing", "/terms"];

const DESKTOP = { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false };
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true };

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

async function once(browser, route, viewport, throttle) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  const client = await page.createCDPSession();
  if (throttle) {
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: (10 * 1024 * 1024) / 8,
      uploadThroughput: (10 * 1024 * 1024) / 8,
      latency: 40,
    });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  await client.send("Network.enable");
  await client.send("Page.enable");

  let bytes = 0;
  client.on("Network.loadingFinished", (e) => {
    bytes += e.encodedDataLength;
  });

  await page.evaluateOnNewDocument(() => {
    window.__v = { lcp: 0, cls: 0, lt: 0 };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__v.lcp = Math.max(window.__v.lcp, e.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__v.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__v.lt += e.duration;
    }).observe({ type: "longtask", buffered: true });
  });

  // `load` rather than networkidle: 3D keeps a render loop alive but not the network.
  await page.goto(BASE + route, { waitUntil: "load", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 3000));

  const r = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0];
    return {
      ttfb: nav ? Math.round(nav.responseStart) : 0,
      fcp: fcp ? Math.round(fcp.startTime) : 0,
      lcp: Math.round(window.__v.lcp),
      cls: Number(window.__v.cls.toFixed(4)),
      tbt: Math.round(window.__v.lt),
      nodes: document.querySelectorAll("*").length,
      heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0,
    };
  });

  await page.close();
  return { ...r, kb: bytes / 1024 };
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  });

  const profiles = MOBILE_ONLY ? [["MOBILE 4x CPU / 10Mbps", MOBILE, true]] : [["DESKTOP", DESKTOP, 0], ["MOBILE 4x CPU / 10Mbps", MOBILE, true]];

  for (const [label, viewport, throttle] of profiles) {
    console.log(`\n============ ${label} (median of ${RUNS}) ============`);
    console.log(
      "route".padEnd(26) + "TTFB".padStart(7) + "FCP".padStart(8) + "LCP".padStart(8) +
      "CLS".padStart(8) + "TBT".padStart(7) + "KB".padStart(8) + "nodes".padStart(8) + "heap".padStart(7),
    );
    console.log("-".repeat(87));

    for (const route of ROUTES) {
      try {
        const runs = [];
        for (let i = 0; i < RUNS; i++) runs.push(await once(browser, route, viewport, throttle));
        const row = {
          ttfb: median(runs.map((r) => r.ttfb)),
          fcp: median(runs.map((r) => r.fcp)),
          lcp: median(runs.map((r) => r.lcp)),
          cls: median(runs.map((r) => r.cls)),
          tbt: median(runs.map((r) => r.tbt)),
          kb: median(runs.map((r) => r.kb)),
          nodes: median(runs.map((r) => r.nodes)),
          heap: median(runs.map((r) => r.heap)),
        };
        console.log(
          route.padEnd(26) + String(row.ttfb).padStart(7) + String(row.fcp).padStart(8) +
          String(row.lcp).padStart(8) + String(row.cls).padStart(8) + String(row.tbt).padStart(7) +
          row.kb.toFixed(0).padStart(8) + String(row.nodes).padStart(8) + (row.heap ? row.heap + "MB" : "").padStart(7),
        );
      } catch (err) {
        console.log(`${route.padEnd(26)} ERROR ${err.message}`);
      }
    }
  }

  await browser.close();
})();