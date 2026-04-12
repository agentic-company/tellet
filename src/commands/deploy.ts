import { spawnSync } from "child_process";
import * as p from "@clack/prompts";
import chalk from "chalk";
import { loadConfig } from "./shared.js";

export default async function deploy(_args: string[]) {
  const config = await loadConfig();

  console.log();
  console.log(
    chalk.bold(
      `  ${chalk.white("tel")}${chalk.yellow("let")} ${chalk.dim("deploy")} — ${config.company.name}`
    )
  );
  console.log();

  // Detect tier from project structure
  const fs = await import("fs-extra");
  const path = await import("path");
  const cwd = process.cwd();

  const hasInfra = await fs.default.pathExists(path.default.join(cwd, "infra"));
  const hasDockerCompose = await fs.default.pathExists(path.default.join(cwd, "docker-compose.yml"));
  const hasRailwayToml = await fs.default.pathExists(path.default.join(cwd, "railway.toml"));

  // Determine available targets
  type Target = "vercel" | "railway" | "docker" | "aws";
  const targets: { value: Target; label: string; hint: string }[] = [];

  targets.push({
    value: "vercel",
    label: "Vercel",
    hint: "Recommended for Quick Start — free, instant",
  });

  if (hasRailwayToml || hasDockerCompose) {
    targets.push({
      value: "railway",
      label: "Railway",
      hint: "Docker-based, $5-20/mo",
    });
  }

  if (hasDockerCompose) {
    targets.push({
      value: "docker",
      label: "Docker (manual)",
      hint: "Any Docker host — Render, Fly.io, etc.",
    });
  }

  if (hasInfra) {
    targets.push({
      value: "aws",
      label: "AWS CDK",
      hint: "Lambda + RDS + CloudFront",
    });
  }

  const choice = await p.select({
    message: "Deploy target:",
    options: targets,
  });

  if (p.isCancel(choice)) {
    p.cancel("Cancelled.");
    return;
  }

  const target = choice as Target;

  switch (target) {
    case "vercel":
      return deployVercel();
    case "railway":
      return deployRailway();
    case "docker":
      return deployDocker();
    case "aws":
      return deployAws(cwd);
  }
}

function deployVercel() {
  console.log(chalk.dim("  Launching Vercel deploy..."));
  console.log();

  const result = spawnSync("npx", ["vercel"], {
    cwd: process.cwd(),
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.log();
    console.log(chalk.dim("  If Vercel CLI is not installed:"));
    console.log(chalk.cyan("    npm i -g vercel && vercel"));
  }
}

function deployRailway() {
  console.log();
  console.log(chalk.bold("  Railway deployment:"));
  console.log();
  console.log(`  ${chalk.dim("1.")} ${chalk.cyan("railway login")}`);
  console.log(`  ${chalk.dim("2.")} ${chalk.cyan("railway init")}`);
  console.log(`  ${chalk.dim("3.")} ${chalk.cyan("railway add --plugin postgresql")}`);
  console.log(`  ${chalk.dim("4.")} ${chalk.cyan("railway up")}`);
  console.log();
  console.log(chalk.dim("  Set environment variables in Railway dashboard after deploy."));
  console.log();
}

function deployDocker() {
  console.log();
  console.log(chalk.bold("  Docker deployment:"));
  console.log();
  console.log(`  ${chalk.dim("Build:")}  ${chalk.cyan("docker build -t tellet .")}`);
  console.log(`  ${chalk.dim("Run:")}    ${chalk.cyan("docker compose up -d")}`);
  console.log();
  console.log(chalk.dim("  Works with Render, Fly.io, DigitalOcean, or any Docker host."));
  console.log();
  console.log(chalk.bold("  Fly.io:"));
  console.log(`  ${chalk.cyan("  fly launch && fly deploy")}`);
  console.log();
  console.log(chalk.bold("  Render:"));
  console.log(chalk.dim("  Connect your GitHub repo at render.com → New Web Service → Docker"));
  console.log();
}

function deployAws(cwd: string) {
  console.log();
  console.log(chalk.bold("  AWS CDK deployment:"));
  console.log();
  console.log(`  ${chalk.cyan("cd infra")}`);
  console.log(`  ${chalk.cyan("npm install")}`);
  console.log(`  ${chalk.cyan("npx cdk bootstrap")}   ${chalk.dim("(first time only)")}`);
  console.log(`  ${chalk.cyan("npx cdk deploy")}`);
  console.log();
  console.log(chalk.dim("  CloudFront URL will be in the output."));
  console.log(chalk.dim("  API keys are stored in AWS Secrets Manager."));
  console.log();
}
