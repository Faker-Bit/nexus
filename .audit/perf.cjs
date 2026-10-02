// Runs a server on a dedicated port (never 3000) for the audit harnesses, runs the
// requested measurements against it, then shuts it down.
//
//   npm run perf:serve          # start on :3100 and leave it running
//   npm run perf                # build, serve on :3100, measure, stop
//
// `npm run dev` on :3000 can run at the same time without clashing.
const { spawn, spawnSync } = require("node:child_process");
const http = require("node:http");

const PORT = Number(process.env.PERF_PORT ?? 3100);
const isWindows = process.platform === "win32";
const npm = isWindows ? "npm.cmd" : "npm";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ping(port) {
  return new Promise((resolve) => {
    const req = http.get({ host: "127.0.0.1", port, path: "/terms", timeout: 1500 }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForPort(port, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    if (await ping(port)) return true;
    await sleep(1000);
  }
  return false;
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: isWindows });
  return result.status === 0;
}

(async () => {
  const keepAlive = process.argv.includes("--keep");

  if (!keepAlive) {
    console.log(`\nBuilding…`);
    if (!run(npm, ["run", "build"])) {
      console.error("build failed");
      process.exit(1);
    }
  }

  console.log(`\nStarting server on :${PORT} (never :3000)…`);
  const server = spawn(npm, ["run", "start", "--", "--port", String(PORT)], {
    stdio: "ignore",
    detached: !isWindows,
    shell: isWindows,
  });

  const up = await waitForPort(PORT);
  if (!up) {
    console.error(`server did not come up on :${PORT}`);
    if (!isWindows) process.kill(-server.pid);
    else server.kill();
    process.exit(1);
  }
  console.log(`ready on :${PORT}\n`);

  const target = `http://localhost:${PORT}`;
  const measurements = (process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "").split(",").filter(Boolean);

  if (measurements.includes("wire") || measurements.length === 0) {
    spawnSync(npm, ["run", "perf:wire"], { stdio: "inherit", shell: isWindows, env: { ...process.env, BASE: target } });
  }
  if (measurements.includes("vitals") || measurements.length === 0) {
    spawnSync(npm, ["run", "perf:vitals"], { stdio: "inherit", shell: isWindows, env: { ...process.env, BASE: target } });
  }

  if (keepAlive) {
    console.log(`\nLeaving the server running on :${PORT} (pid ${server.pid}).`);
    console.log(`Stop it with:  Stop-Process -Id ${server.pid}   (or kill ${server.pid})`);
    return;
  }

  console.log(`\nStopping server…`);
  if (!isWindows) process.kill(-server.pid);
  else spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  server.kill();
  console.log(`done — :${PORT} released, :3000 untouched.`);
})();