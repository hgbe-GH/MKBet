import { spawn } from "node:child_process";

import { getNextE2EEnvironment } from "../tests/e2e/support/local-supabase";

const environment = getNextE2EEnvironment();

function run(command: string, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: environment,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

async function main(): Promise<void> {
  const buildExitCode = await run("pnpm", ["build"]);
  if (buildExitCode !== 0) {
    process.exit(buildExitCode);
  }

  const server = spawn(
    "pnpm",
    ["exec", "next", "start", "-H", "127.0.0.1", "-p", "3100"],
    {
      env: environment,
      stdio: "inherit",
    },
  );

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => server.kill(signal));
  }

  server.once("error", (error) => {
    throw error;
  });
  server.once("exit", (code) => process.exit(code ?? 0));
}

void main();
