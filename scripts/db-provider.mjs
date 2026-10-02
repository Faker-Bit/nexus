#!/usr/bin/env node
/**
 * Keeps `prisma/schema.prisma` in sync with `DATABASE_URL`.
 *
 * Prisma requires the datasource provider to be a literal, so this rewrites that
 * one line on every `predev`, `prebuild` and `postinstall`:
 *
 *   file:…   -> sqlite      (local development, zero setup)
 *   postgres: -> postgresql  (Vercel / any hosted database)
 *
 * The rewrite is idempotent and only ever touches the provider line, so it is
 * safe to run on a clean checkout, in CI, and on a machine where neither
 * database exists yet.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = join(root, "prisma", "schema.prisma");

/** Reads DATABASE_URL from the process or from a .env file. */
function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.trim();
  try {
    const env = readFileSync(join(root, ".env"), "utf8");
    const match = env.match(/^\s*DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

const url = readDatabaseUrl();
const wanted = url.startsWith("file:") ? "sqlite" : "postgresql";
const other = wanted === "sqlite" ? "postgresql" : "sqlite";

const schema = readFileSync(schemaPath, "utf8");
const current = schema.match(/provider\s*=\s*"(sqlite|postgresql)"/)?.[1];

if (current === wanted) {
  console.log(`[db] provider already ${wanted} (${url ? url.split(":")[0] : "no DATABASE_URL"})`);
  process.exit(0);
}

const updated = schema.replace(
  /(datasource\s+db\s*\{\s*\n\s*provider\s*=\s*)"(sqlite|postgresql)"/,
  `$1"${wanted}"`,
);

if (updated === schema) {
  console.error("[db] could not find the datasource provider line — check prisma/schema.prisma");
  process.exit(1);
}

writeFileSync(schemaPath, updated, "utf8");
console.log(`[db] provider ${current ?? "unset"} -> ${wanted} (from ${url ? url.split(":")[0] : "no DATABASE_URL"})`);
if (wanted === "postgresql") {
  console.log("[db] postgres requires a pooled DATABASE_URL on serverless platforms");
}
