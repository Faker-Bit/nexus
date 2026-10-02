// What is actually inside a given route's chunk list: fingerprints + top symbols.
const fs = require("node:fs");
const path = require("node:path");

const manifest = JSON.parse(fs.readFileSync(path.join(".next", "app-build-manifest.json"), "utf8"));
const target = process.argv[2] ?? "/layout";
const files = manifest.pages[target] ?? [];

const FINGERPRINTS = {
  "three.js core": /THREE\.REVISION/,
  "three examples": /OrbitControls|EffectComposer|GLTFLoader/,
  "@react-three/fiber": /useFrame|__fiber|reconciler/,
  "@react-three/drei": /drei|Environment__|useTexture/,
  "postprocessing": /BloomEffect|pass\(\{ *id: *"RenderPass"/,
  "@react-three/postprocessing": /@react-three\/postprocessing/,
  "framer-motion (motion)": /VisualElement|animateValue|motionValue/,
  "framer-motion (dom)": /m\.animate|projection\.nodeStyle/,
  "recharts": /recharts|CartesianAxis|recharts__/,
  "react-dom": /react-dom|__DOM_INTERNALS/,
  "react-router-ish": /useSyncExternalStore/,
  "date/Intl polyfill": /Intl\.DateTimeFormat.*function/,
  "uuid/nanoid": /nanoid|randomUUID/,
};

console.log(`\n=== ${target} (${files.length} chunks) ===`);
let total = 0;
for (const f of files) {
  const full = path.join(".next", f);
  if (!fs.existsSync(full)) continue;
  const kb = fs.statSync(full).size / 1024;
  total += kb;
  const text = fs.readFileSync(full, "utf8");
  const hits = Object.entries(FINGERPRINTS)
    .filter(([, re]) => re.test(text))
    .map(([name]) => name);
  if (kb > 15 || hits.length) {
    console.log(`${kb.toFixed(0).padStart(7)} kB  ${path.basename(f).padEnd(30)} ${hits.join(" | ")}`);
  }
}
console.log(`${total.toFixed(0)} kB raw total`);