#!/usr/bin/env node

import * as p from "@clack/prompts";
import chalk from "chalk";
import { generateAgents } from "./ai/generate.js";
import { scaffoldProject } from "./scaffold/project.js";

async function main() {
  console.clear();
  console.log();
  console.log(
    chalk.bold(
      `  ${chalk.white("tel")}${chalk.yellow("let")} ${chalk.dim("— Build Your AI Company")}`
    )
  );
  console.log();

  p.intro(chalk.bgHex("#8b5cf6").white(" create-tellet "));

  // Step 1: Company info
  const company = await p.group(
    {
      name: () =>
        p.text({
          message: "What's your company name?",
          placeholder: "Sunny Coffee",
          validate: (v) => (!v ? "Company name is required" : undefined),
        }),
      description: () =>
        p.text({
          message:
            "Describe your business (what you do, who your customers are, what help you need):",
          placeholder:
            "We sell specialty coffee subscriptions. Customers are coffee enthusiasts aged 25-45...",
          validate: (v) =>
            !v || v.length < 20
              ? "Please provide at least a few sentences"
              : undefined,
        }),
    },
    {
      onCancel: () => {
        p.cancel("Setup cancelled.");
        process.exit(0);
      },
    }
  );

  // Step 2: Generate agents with AI
  const s = p.spinner();
  s.start("Generating your AI team...");

  let agents;
  try {
    agents = await generateAgents(
      company.name as string,
      company.description as string
    );
    s.stop("Your AI team is ready!");
  } catch (err) {
    s.stop("Failed to generate agents.");
    p.log.error(
      err instanceof Error ? err.message : "Check your ANTHROPIC_API_KEY"
    );
    p.cancel("Setup failed.");
    process.exit(1);
  }

  // Step 3: Show agents
  p.log.info(chalk.bold("Meet your team:"));
  console.log();
  for (const agent of agents.agents) {
    console.log(
      `  ${chalk.hex("#8b5cf6").bold(agent.name)} ${chalk.dim(`(${agent.role})`)}`
    );
    console.log(`  ${chalk.dim(agent.description)}`);
    console.log();
  }

  const confirm = await p.confirm({
    message: "Looks good?",
    initialValue: true,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }

  // Step 4: Infrastructure setup
  const infra = await p.group(
    {
      anthropicKey: () =>
        p.text({
          message: "Your Anthropic API key:",
          placeholder: "sk-ant-...",
          validate: (v) => (!v ? "API key is required" : undefined),
        }),
      supabaseUrl: () =>
        p.text({
          message: "Your Supabase project URL:",
          placeholder: "https://xxx.supabase.co",
          validate: (v) =>
            !v || !v.includes("supabase")
              ? "Please enter a valid Supabase URL"
              : undefined,
        }),
      supabaseKey: () =>
        p.text({
          message: "Your Supabase publishable key:",
          placeholder: "sb_publishable_...",
          validate: (v) => (!v ? "Key is required" : undefined),
        }),
    },
    {
      onCancel: () => {
        p.cancel("Setup cancelled.");
        process.exit(0);
      },
    }
  );

  // Step 5: Scaffold project
  s.start("Creating your project...");

  try {
    const projectDir = await scaffoldProject({
      company: {
        name: company.name as string,
        description: company.description as string,
        industry: agents.industry,
      },
      agents: agents.agents,
      infra: {
        anthropicKey: infra.anthropicKey as string,
        supabaseUrl: infra.supabaseUrl as string,
        supabaseKey: infra.supabaseKey as string,
      },
    });

    s.stop("Project created!");

    const slug = (company.name as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    p.note(
      [
        `cd ${slug}`,
        `npm install`,
        `npm run dev        ${chalk.dim("→ http://localhost:3000")}`,
        ``,
        `Dashboard:    ${chalk.dim("/dashboard")}`,
        `Chat Widget:  ${chalk.dim("Embedded on homepage")}`,
        `Agents:       ${chalk.dim(`${agents.agents.length} active`)}`,
      ].join("\n"),
      "Your AI company is ready"
    );

    p.outro(
      `Next: ${chalk.cyan("vercel deploy")} to go live`
    );
  } catch (err) {
    s.stop("Failed to create project.");
    p.log.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main().catch(console.error);
