import { spawn, execSync } from "child_process";
import { get } from "http";

const ROOT = new URL("..", import.meta.url).pathname;

function waitForServer(timeout = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      if (Date.now() - start > timeout) {
        return reject(new Error("Timeout waiting for dev server on :3000"));
      }
      get("http://localhost:3000", (res) => {
        if (res.statusCode) resolve();
        else setTimeout(check, 400);
      }).on("error", () => setTimeout(check, 400));
    }
    check();
  });
}

async function main() {
  try {
    execSync("lsof -ti:3000 | xargs kill -9 2>/dev/null", { cwd: ROOT });
  } catch {}

  const server = spawn("npx", ["tsx", "server.ts"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  try {
    await waitForServer();
    console.log("Launching Electron...");

    const electron = spawn("node_modules/.bin/electron", ["dist-electron/main.cjs"], {
      cwd: ROOT,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    electron.on("close", (code) => {
      server.kill();
      process.exit(code ?? 0);
    });

    process.on("SIGINT", () => {
      server.kill();
      process.exit(0);
    });
  } catch (err) {
    console.error(err.message);
    server.kill();
    process.exit(1);
  }
}

main();
