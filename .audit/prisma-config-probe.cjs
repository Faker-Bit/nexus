// Prints the datasource field of PrismaConfigInternal so we can tell whether the
// provider may come from the environment rather than being a schema literal.
const fs = require("node:fs");
const t = fs.readFileSync("./node_modules/@prisma/config/dist/index.d.ts", "utf8");

const idx = t.indexOf("engine: 'classic'");
console.log(t.slice(idx - 60, idx + 700));

console.log("\n--- does anything mention a provider field on the config? ---");
for (const m of t.matchAll(/provider\??:[\s\S]{0,120}/g)) {
  console.log("  " + m[0].replace(/\s+/g, " ").slice(0, 140));
}