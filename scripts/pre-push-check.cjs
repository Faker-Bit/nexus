// Pre-push safety check.
//
// Only inspects files git would actually track, so local databases, build
// output and env files never produce false positives. Reports the file and line
// of anything sensitive — never the value itself.
//
//   node scripts/pre-push-check.cjs
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = process.cwd();
let problems = 0;

const SECRET_PATTERNS = [
  [/(?:AUTH_SECRET|SESSION_SECRET|JWT_SECRET)\s*=\s*(?!\s*$|dev-only|change-me|xxx|<|YOUR_)[^\s"']{16,}/i, "looks like a real signing secret"],
  [/(?:api[_-]?key|apikey|access[_-]?key|secret[_-]?key|auth[_-]?token)\s*[:=]\s*["'][A-Za-z0-9_\-]{20,}["']/i, "looks like an API key or token"],
  [/\bghp_[A-Za-z0-9]{36}\b/, "GitHub personal access token"],
  [/\bgithub_pat_[A-Za-z0-9_]{50,}\b/, "GitHub fine-grained PAT"],
  [/\bsk-[A-Za-z0-9]{32,}\b/, "provider secret key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
  [/postgres(?:ql)?:\/\/[^:\s"']+:(?![A-Z]{4,}|PASSWORD|PLACEHOLDER)[^@\s"']{6,}@/i, "database URL with a real-looking password"],
];

const TEXT_EXT = new Set([
  ".ts", ".tsx", ".js", ".cjs", ".mjs", ".json", ".md", ".css", ".prisma",
  ".yml", ".yaml", ".toml", ".txt", ".sql", ".svg", ".env", ".example",
]);
const SKIP_NAMES = new Set([".env", ".env.local", "dev.db", "dev.db-journal"]);

function gitAvailable() {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Every file git would track, honouring .gitignore. */
function trackedFiles() {
  if (!gitAvailable()) return null;
  try {
    const out = execFileSync(
      "git",
      ["ls-files", "--cached", "--others", "--exclude-standard"],
      { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
    );
    return out.split(/\r?\n/).filter(Boolean);
  } catch {
    return null;
  }
}

const tracked = trackedFiles();

function walk(dir, depth = 0) {
  if (depth > 8) return [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".next") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, depth + 1));
    else out.push(path.relative(ROOT, full).replace(/\\/g, "/"));
  }
  return out;
}

// Without git we fall back to the filesystem minus the obvious generated paths.
const files = tracked ?? walk(ROOT).filter((rel) => !SKIP_NAMES.has(path.basename(rel)) && !rel.startsWith("prisma/dev.db"));

if (!tracked) {
  console.warn("[check] git repo not initialised yet — falling back to a filesystem scan.\n");
}

const large = [];
let totalBytes = 0;

for (const rel of files) {
  const full = path.join(ROOT, rel);
  let stat;
  try {
    stat = fs.statSync(full);
  } catch {
    continue;
  }
  totalBytes += stat.size;
  if (stat.size > 1_500_000) large.push(`${rel} (${(stat.size / 1048576).toFixed(1)} MB)`);

  const ext = path.extname(rel);
  const isText = TEXT_EXT.has(ext) || /^(Dockerfile|Makefile|LICENSE|CODEOWNERS)$/.test(path.basename(rel));
  if (!isText) continue;

  const text = fs.readFileSync(full, "utf8");
  for (const [pattern, label] of SECRET_PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const line = text.slice(0, match.index).split("\n").length;
    console.error(`SECRET  ${rel}:${line}  ${label}`);
    problems++;
  }
}

if (large.length) {
  console.error("Large files (>1.5 MB) that would be committed:");
  for (const item of large.slice(0, 10)) console.error(`   ${item}`);
  problems += large.length;
}

console.log(`\nchecked ${files.length} tracked files, ${(totalBytes / 1048576).toFixed(2)} MB`);
if (problems) {
  console.error(`${problems} problem(s) — resolve these before pushing.`);
  process.exit(1);
}
console.log("no secrets, no oversized files. clear to push.");