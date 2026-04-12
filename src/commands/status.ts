import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { loadConfigOrExit } from "./shared.js";

export default async function status(_args: string[]) {
  const config = await loadConfigOrExit();

  console.log();
  console.log(
    chalk.bold(
      `  ${chalk.white("tel")}${chalk.yellow("let")} ${chalk.dim("status")}`
    )
  );
  console.log();

  // Company
  console.log(chalk.bold("  Company"));
  console.log(`    Name:     ${chalk.white(config.company.name)}`);
  console.log(`    Industry: ${chalk.dim(config.company.industry)}`);
  console.log(`    Mode:     ${chalk.dim(config.mode)}`);
  console.log();

  // LLM
  console.log(chalk.bold("  LLM"));
  console.log(`    Provider: ${chalk.white(config.llm.provider)}`);
  console.log(`    Model:    ${chalk.dim(config.llm.defaultModel)}`);
  console.log();

  // Agents
  console.log(chalk.bold(`  Agents (${config.agents.length})`));
  for (const agent of config.agents) {
    const tools = agent.tools.length > 0 ? chalk.dim(` [${agent.tools.join(", ")}]`) : "";
    console.log(
      `    ${chalk.hex("#8b5cf6")(agent.name)} ${chalk.dim(`(${agent.role})`)}${tools}`
    );
  }
  console.log();

  // Channels
  const enabledChannels = Object.entries(config.channels)
    .filter(([, v]) => v.enabled)
    .map(([k]) => k);
  const disabledChannels = Object.entries(config.channels)
    .filter(([, v]) => !v.enabled)
    .map(([k]) => k);

  console.log(chalk.bold("  Channels"));
  if (enabledChannels.length > 0) {
    console.log(`    Enabled:  ${chalk.green(enabledChannels.join(", "))}`);
  }
  if (disabledChannels.length > 0) {
    console.log(`    Disabled: ${chalk.dim(disabledChannels.join(", "))}`);
  }
  console.log();

  // Environment check
  console.log(chalk.bold("  Environment"));
  const envPath = path.resolve(process.cwd(), ".env.local");
  const envExists = await fs.pathExists(envPath);
  console.log(`    .env.local: ${envExists ? chalk.green("found") : chalk.red("missing")}`);

  const nodeModules = await fs.pathExists(path.resolve(process.cwd(), "node_modules"));
  console.log(`    node_modules: ${nodeModules ? chalk.green("installed") : chalk.yellow("not installed — run npm install")}`);

  const hasPackageLock = await fs.pathExists(path.resolve(process.cwd(), "package-lock.json"));
  console.log(`    lock file: ${hasPackageLock ? chalk.green("found") : chalk.dim("none")}`);
  console.log();
}
