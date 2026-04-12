import { spawnSync } from "child_process";
import chalk from "chalk";
import { loadConfig } from "./shared.js";

export default async function build(_args: string[]) {
  const config = await loadConfig();

  console.log();
  console.log(
    chalk.bold(
      `  ${chalk.white("tel")}${chalk.yellow("let")} ${chalk.dim("build")} — ${config.company.name}`
    )
  );
  console.log();

  const result = spawnSync("npx", ["next", "build"], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  process.exit(result.status ?? 1);
}
