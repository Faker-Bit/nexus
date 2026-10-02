// Bundle audit: maps chunk files back to the npm packages they contain.
const fs = require("node:fs");
const path = require("node:path");

const CHUNK_DIR = path.join(".next", "static", "chunks");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

const files = fs.existsSync(CHUNK_DIR) ? walk(CHUNK_DIR) : [];

// Package fingerprints that survive minification.
const SIGNATURES = {
  three: [/three\.module\.js|THREE\.REVISION/],
  "@react-three/fiber": [/react-three-fiber|createRoot\(.*useFrame|__fiber/],
  "@react-three/drei": [/drei|OrbitControls__|drei__/],
  "@react-three/postprocessing": [/postprocessing__|EffectComposer__|@react-three\/postprocessing/],
  postprocessing: [/pass\(\{.*id:"|BloomEffect|postprocessing__/],
  "framer-motion": [/framer-motion|motionValue|animateValue|__motion/],
  recharts: [/recharts|recharts__/],
  lucide: [/createLucideIcon|IconNode|__iconNode/],
  zod: [/\bZodError|ZodString|invalid_type/],
  jose: [/jose|compactDecrypt/],
  bcryptjs: [/bcrypt/],
  viem: [/formatEther|keccak256|parseAbi/],
  prisma: [/PrismaClient|__prisma/],
};

const totals = new Map();
const perFile = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const kb = Buffer.byteLength(text) / 1024;
  const found = [];
  for (const [pkg, patterns] of Object.entries(SIGNATURES)) {
    if (patterns.some((p) => p.test(text))) {
      found.push(pkg);
      totals.set(pkg, (totals.get(pkg) ?? 0) + kb);
    }
  }
  perFile.push({ file: path.basename(file), kb, found });
}

console.log("=== chunks (KB, packages detected) ===");
perFile
  .sort((a, b) => b.kb - a.kb)
  .slice(0, 22)
  .forEach((c) => console.log(`${c.kb.toFixed(1).padStart(8)} KB  ${c.file.padEnd(34)} ${c.found.join(", ")}`));

console.log("\n=== total KB by package (files containing the fingerprint) ===");
[...totals.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([pkg, kb]) => console.log(`${kb.toFixed(1).padStart(8)} KB  ${pkg}`));

const cssFiles = fs.existsSync(path.join(".next", "static", "css"))
  ? walk(path.join(".next", "static", "css"))
  : [];
const cssKb = cssFiles.reduce((acc, f) => acc + fs.statSync(f).size / 1024, 0);
console.log(`\nCSS total: ${cssKb.toFixed(1)} KB`);