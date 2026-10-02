// Route-level bundle audit: maps each page to the chunks it loads and reports
// the compressed size actually sent over the wire.
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const manifestPath = path.join(".next", "app-build-manifest.json");
if (!fs.existsSync(manifestPath)) {
  console.error("no build manifest — run `npm run build` first");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

function gz(file) {
  try {
    return zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length / 1024;
  } catch {
    return 0;
  }
}
function br(file) {
  try {
    return zlib.brotliCompressSync(fs.readFileSync(file)).length / 1024;
  } catch {
    return 0;
  }
}

const PACKAGES = [
  { name: "three", re: /THREE\.REVISION|three\.module|WebGLRenderer/ },
  { name: "@react-three/fiber", re: /__fiber|react-three-fiber|createRoot\(/ },
  { name: "@react-three/drei", re: /drei|OrbitControls__/ },
  { name: "@react-three/postprocessing", re: /@react-three\/postprocessing|EffectComposer__/ },
  { name: "postprocessing", re: /BloomEffect|KernelSize|postprocessing__/ },
  { name: "framer-motion", re: /motionValue|animateValue|VisualElement|__motion/ },
  { name: "recharts", re: /recharts|RechartsWrapper|cartesianAxis/ },
  { name: "react-dom", re: /react-dom|__DOM_INTERNALS/ },
];

function classify(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return [];
  }
  return PACKAGES.filter((p) => p.re.test(text)).map((p) => p.name);
}

const rows = [];
for (const [route, files] of Object.entries(manifest.pages)) {
  if (route.includes("/api/")) continue;
  let raw = 0;
  let gzipped = 0;
  let brotli = 0;
  const pkgs = new Set();
  for (const f of files) {
    const full = path.join(".next", f);
    if (!fs.existsSync(full)) continue;
    raw += fs.statSync(full).size;
    gzipped += gz(full);
    brotli += br(full);
    for (const p of classify(full)) pkgs.add(p);
  }
  rows.push({ route, raw: raw / 1024, gz: gzipped, br: brotli, pkgs: [...pkgs] });
}

rows.sort((a, b) => b.gz - a.gz);
console.log("route".padEnd(32) + "raw".padStart(9) + "gzip".padStart(9) + "brotli".padStart(9) + "  heaviest packages");
for (const r of rows) {
  console.log(
    r.route.padEnd(32) +
      `${r.raw.toFixed(0)}kB`.padStart(9) +
      `${r.gz.toFixed(0)}kB`.padStart(9) +
      `${r.br.toFixed(0)}kB`.padStart(9) +
      "  " +
      r.pkgs.join(", "),
  );
}

const totals = rows.reduce(
  (acc, r) => ({
    raw: acc.raw + r.raw,
    gz: acc.gz + r.gz,
    br: acc.br + r.br,
  }),
  { raw: 0, gz: 0, br: 0 },
);
console.log(
  `\nTOTAL across ${rows.length} routes: raw ${totals.raw.toFixed(0)}kB · gzip ${totals.gz.toFixed(0)}kB · brotli ${totals.br.toFixed(0)}kB`,
);

// CSS + font payload
function walk(dir, match, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, match, out);
    else if (match.test(e.name)) out.push(full);
  }
  return out;
}
const css = walk(path.join(".next", "static"), /\.css$/);
const fonts = walk(path.join(".next", "static"), /\.(woff2?|ttf|otf)$/);
const cssKb = css.reduce((a, f) => a + fs.statSync(f).size, 0) / 1024;
const fontKb = fonts.reduce((a, f) => a + gz(f), 0);
console.log(`CSS: ${cssKb.toFixed(1)} kB raw across ${css.length} file(s)`);
console.log(`Fonts: ${fontKb.toFixed(1)} kB gzip across ${fonts.length} file(s)`);
fonts.forEach((f) => console.log(`   ${(gz(f)).toFixed(1)} kB  ${path.basename(f)}`));