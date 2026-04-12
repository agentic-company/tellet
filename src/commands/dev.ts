import { spawnSync } from "child_process";
import chalk from "chalk";
import { loadConfigOrExit } from "./shared.js";

export default async function dev(_args: string[]) {
  const config = await loadConfigOrExit();

  console.log();
  console.log(
    chalk.bold(
      `  ${chalk.white("tel")}${chalk.yellow("let")} ${chalk.dim("dev")} — ${config.company.name}`
    )
  );
  console.log(
    chalk.dim(`  ${config.agents.length} agents · ${config.llm.provider} · ${config.storage}`)
  );
  console.log();

  const result = spawnSync("npx", ["next", "dev"], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  process.exit(result.status ?? 1);
}
