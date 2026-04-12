import { spawnSync } from "child_process";
import * as p from "@clack/prompts";

/**
 * Run `npm install` in the project directory with live output.
 */
export async function installDependencies(projectDir: string): Promise<boolean> {
  const s = p.spinner();
  s.start("Installing dependencies...");

  const result = spawnSync("npm", ["install"], {
    cwd: projectDir,
    stdio: "pipe",
    timeout: 300_000,
  });

  if (result.status !== 0) {
    s.stop("Failed to install dependencies.");
    const stderr = result.stderr?.toString().trim();
    if (stderr) {
      p.log.error(stderr.slice(0, 500));
    }
    return false;
  }

  s.stop("Dependencies installed!");
  return true;
}
