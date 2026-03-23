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

  p.intro(chalk.bgHex("#8b5cf6").white(" @tellet/create "));

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

  // Step 2: Get API key if not in env
  let anthropicKey = process.env.ANTHROPIC_API_KEY || "";
  if (!anthropicKey) {
    const keyInput = await p.text({
      message: "Your Anthropic API key (needed to generate your AI team):",
      placeholder: "sk-ant-...",
      validate: (v) =>
        !v || !v.startsWith("sk-ant-")
          ? "Please enter a valid Anthropic API key (starts with sk-ant-)"
          : undefined,
    });
    if (p.isCancel(keyInput)) {
      p.cancel("Setup cancelled.");
      process.exit(0);
    }
    anthropicKey = keyInput as string;
    process.env.ANTHROPIC_API_KEY = anthropicKey;
  } else {
    p.log.info(chalk.dim("Using ANTHROPIC_API_KEY from environment."));
  }

  // Step 3: Generate agents + site content with AI
  const s = p.spinner();
  s.start("Generating your AI team and website...");

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

  // Step 4: Show agents + site preview
  p.log.info(chalk.bold("Meet your team:"));
  console.log();
  for (const agent of agents.agents) {
    console.log(
      `  ${chalk.hex("#8b5cf6").bold(agent.name)} ${chalk.dim(`(${agent.role})`)}`
    );
    console.log(`  ${chalk.dim(agent.description)}`);
    console.log();
  }

  if (agents.site) {
    p.log.info(chalk.bold("Your website:"));
    console.log(`  ${chalk.hex("#f59e0b")(agents.site.tagline)}`);
    console.log(`  ${chalk.dim(agents.site.subtitle)}`);
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

  // Step 5: Supabase setup
  p.log.info(
    `${chalk.bold("Supabase setup")} ${chalk.dim("(free tier works fine)")}\n` +
    `  ${chalk.dim("1.")} Create a project at ${chalk.cyan("https://supabase.com/dashboard/new")}\n` +
    `  ${chalk.dim("2.")} Go to Settings → API to find your URL and keys`
  );

  const supabase = await p.group(
    {
      url: () =>
        p.text({
          message: "Your Supabase project URL:",
          placeholder: "https://xxx.supabase.co",
          validate: (v) =>
            !v || !v.includes("supabase")
              ? "Please enter a valid Supabase URL"
              : undefined,
        }),
      key: () =>
        p.text({
          message: "Your Supabase publishable key (anon/public):",
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

  // Step 6: Scaffold project
  s.start("Creating your project...");

  try {
    const projectDir = await scaffoldProject({
      company: {
        name: company.name as string,
        description: company.description as string,
        industry: agents.industry,
      },
      agents: agents.agents,
      site: agents.site,
      infra: {
        anthropicKey,
        supabaseUrl: supabase.url as string,
        supabaseKey: supabase.key as string,
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
