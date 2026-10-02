// Lists the deferred (async) chunks that are fetched after first paint.
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const dir = path.join(".next", "static", "chunks");
const rows = [];

(function walk(d) {
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    const full = path.join(d, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!entry.name.endsWith(".js")) continue;

    // Next marks split points with a second hash: `name.<hash>.js`
    if (!/\.[a-f0-9]{16}\.js$/.test(entry.name)) continue;

    const buf = fs.readFileSync(full);
    const gz = zlib.gzipSync(buf, { level: 9 }).length;
    const text = buf.toString("utf8");
    const libs = [];
    if (/WebGLRenderer|ShaderChunk|ACESFilmicToneMapping/.test(text)) libs.push("three");
    if (/createFiberRoot|useFrame|__r3f/.test(text)) libs.push("r3f");
    if (/drei|OrbitControls__|AdaptiveDpr/.test(text)) libs.push("drei");
    if (/EffectComposer__|@react-three/.test(text)) libs.push("rtp");
    if (/BloomEffect|KernelSize\.AUTO/.test(text)) libs.push("postprocessing");
    if (/recharts|CartesianAxis/.test(text)) libs.push("recharts");

    rows.push({ gz: gz / 1024, raw: buf.length / 1024, name: entry.name, libs });
  }
})(dir);

rows.sort((a, b) => b.gz - a.gz);
console.log("DEFERRED (async) chunks — fetched after first paint\n");
for (const r of rows.slice(0, 12)) {
  console.log(
    `  ${r.gz.toFixed(0).padStart(5)} kB gz  ${r.name.padEnd(36)} ${r.libs.join(", ")}`,
  );
}
const raw = rows.reduce((a, r) => a + r.raw, 0);
const gz = rows.reduce((a, r) => a + r.gz, 0);
console.log(`\n  total: ${raw.toFixed(0)} kB raw / ${gz.toFixed(0)} kB gzip across ${rows.length} chunks`);