#!/usr/bin/env node

import chalk from "chalk";

const COMMANDS: Record<string, { description: string; module: string }> = {
  dev: { description: "Start development server", module: "./commands/dev.js" },
  build: { description: "Build for production", module: "./commands/build.js" },
  status: { description: "Show project status", module: "./commands/status.js" },
  agent: { description: "Manage agents (list, add, remove)", module: "./commands/agent.js" },
  deploy: { description: "Deploy your project", module: "./commands/deploy.js" },
  mcp: { description: "Start MCP server (for Claude Code / Cursor)", module: "./commands/mcp.js" },
};

function printBanner() {
  console.log();
  console.log(
    chalk.bold(
      `  ${chalk.white("tel")}${chalk.yellow("let")} ${chalk.dim("CLI")}`
    )
  );
  console.log();
}

function printHelp() {
  printBanner();
  console.log(chalk.bold("  Usage:"));
  console.log(`    ${chalk.cyan("tellet")} ${chalk.dim("<command>")}`);
  console.log(`    ${chalk.cyan("npx @tellet/create")} ${chalk.dim("<command>")}`);
  console.log();
  console.log(chalk.bold("  Commands:"));

  const padLen = Math.max(...Object.keys(COMMANDS).map((k) => k.length)) + 2;
  for (const [name, cmd] of Object.entries(COMMANDS)) {
    console.log(`    ${chalk.cyan(name.padEnd(padLen))} ${chalk.dim(cmd.description)}`);
  }

  console.log();
  console.log(`    ${chalk.cyan("(no command)".padEnd(padLen))} ${chalk.dim("Create a new tellet project")}`);
  console.log();
  console.log(chalk.dim("  Run tellet <command> --help for command-specific help."));
  console.log();
}

export async function run(args: string[]) {
  const command = args[0];

  // No command or help → check if we should scaffold or show help
  if (!command || command === "help" || command === "--help" || command === "-h") {
    // If no command and no tellet.json in CWD, run scaffold
    if (!command) {
      const { main: scaffold } = await import("./scaffold-flow.js");
      return scaffold();
    }
    printHelp();
    return;
  }

  const cmd = COMMANDS[command];
  if (!cmd) {
    console.error(chalk.red(`  Unknown command: ${command}`));
    console.log(chalk.dim(`  Run ${chalk.cyan("tellet help")} to see available commands.`));
    process.exit(1);
  }

  const subArgs = args.slice(1);
  const mod = await import(cmd.module);
  await mod.default(subArgs);
}

