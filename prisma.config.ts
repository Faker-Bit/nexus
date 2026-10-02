import { readFileSync } from "node:fs";
import { defineConfig } from "prisma/config";

/**
 * Replaces the deprecated `package.json#prisma` block.
 *
 * Adding this file also switches off Prisma's implicit `.env` loading, so the
 * local file is parsed here first. Real environment variables always win, which
 * is what makes Vercel work: the platform injects `DATABASE_URL` and the rest
 * directly and there is no `.env` file in the build.
 */
function loadLocalEnv() {
  let contents: string;
  try {
    contents = readFileSync(".env", "utf8");
  } catch {
    return;
  }

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(trimmed);
    if (!match) continue;
    const key = match[1];
    if (process.env[key] !== undefined) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadLocalEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});