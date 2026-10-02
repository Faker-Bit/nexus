// Which CardData fields are actually read by client components?
const fs = require("node:fs");
const path = require("node:path");

const FIELDS = [
  "id", "slug", "title", "tagline", "summary", "category", "categoryLabel", "hue",
  "tags", "language", "license", "licenseLabel", "priceCents", "originalPriceCents",
  "discount", "currency", "chain", "acceptsOffers", "acceptsMeme", "memeToken",
  "coverImage", "saleCount", "likeCount", "viewCount", "ratingAvg", "ratingCount",
  "trendingScore", "featured", "publishedAt", "creator",
];

const usages = Object.fromEntries(FIELDS.map((f) => [f, []]));

(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|ts)$/.test(entry.name)) {
      const text = fs.readFileSync(full, "utf8");
      for (const field of FIELDS) {
        const re = new RegExp(`\\b(project|p|item|projectData)\\.${field}\\b`);
        if (re.test(text)) usages[field].push(path.basename(full));
      }
    }
  }
})("src/components");

const used = FIELDS.filter((f) => usages[f].length > 0);
const unused = FIELDS.filter((f) => usages[f].length === 0);

console.log("USED".padEnd(20) + "files");
for (const f of used) console.log("  " + f.padEnd(18) + usages[f].slice(0, 4).join(", "));
console.log("\nUNUSED (safe to drop from the client payload)".padEnd(40));
console.log("  " + unused.join(", "));
console.log(`\n${unused.length}/${FIELDS.length} fields are dead weight in every card payload.`);