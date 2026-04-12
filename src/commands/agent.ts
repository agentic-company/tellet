import * as p from "@clack/prompts";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import { loadConfigOrExit, saveConfig } from "./shared.js";

const VALID_ROLES = [
  "customer_support",
  "sales",
  "marketing",
  "operations",
  "analytics",
  "development",
] as const;

export default async function agent(args: string[]) {
  const sub = args[0];

  switch (sub) {
    case "list":
    case "ls":
      return agentList();
    case "add":
      return agentAdd();
    case "remove":
    case "rm":
      return agentRemove(args[1]);
    default:
      console.log();
      console.log(chalk.bold("  Usage:"));
      console.log(`    tellet agent list     ${chalk.dim("List all agents")}`);
      console.log(`    tellet agent add      ${chalk.dim("Add a new agent")}`);
      console.log(`    tellet agent remove   ${chalk.dim("Remove an agent")}`);
      console.log();
  }
}

async function agentList() {
  const config = await loadConfigOrExit();

  console.log();
  console.log(
    chalk.bold(`  Agents (${config.agents.length})`)
  );
  console.log();

  for (const agent of config.agents) {
    const channels = agent.channels.join(", ");
    const tools = agent.tools.length > 0 ? agent.tools.join(", ") : chalk.dim("none");
    console.log(`  ${chalk.hex("#8b5cf6").bold(agent.name)}`);
    console.log(`    ID:       ${chalk.dim(agent.id)}`);
    console.log(`    Role:     ${chalk.dim(agent.role)}`);
    console.log(`    Model:    ${chalk.dim(agent.model)}`);
    console.log(`    Channels: ${chalk.dim(channels)}`);
    console.log(`    Tools:    ${tools}`);
    console.log();
  }
}

async function agentAdd() {
  const config = await loadConfigOrExit();

  console.log();
  p.intro(chalk.bgHex("#8b5cf6").white(" Add Agent "));

  const info = await p.group(
    {
      name: () =>
        p.text({
          message: "Agent name:",
          placeholder: "Luna",
          validate: (v) => (!v ? "Name is required" : undefined),
        }),
      role: () =>
        p.select({
          message: "Role:",
          options: VALID_ROLES.map((r) => ({ value: r, label: r.replace(/_/g, " ") })),
        }),
      description: () =>
        p.text({
          message: "What does this agent do?",
          placeholder: "Handles billing inquiries and payment processing",
          validate: (v) => (!v ? "Description is required" : undefined),
        }),
    },
    {
      onCancel: () => {
        p.cancel("Cancelled.");
        process.exit(0);
      },
    }
  );

  const name = info.name as string;
  const role = info.role as string;
  const description = info.description as string;

  // Generate ID from name
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

  // Check for duplicate
  if (config.agents.some((a) => a.id === id)) {
    p.log.error(`Agent with ID "${id}" already exists.`);
    process.exit(1);
  }

  const model = config.llm.defaultModel;
  const systemPrompt = `You are ${name}, the ${role.replace(/_/g, " ")} agent for ${config.company.name}. ${description}`;

  // Add to tellet.json
  config.agents.push({
    id,
    name,
    role,
    model,
    channels: ["web_chat"],
    tools: role === "customer_support" ? ["search_knowledge"] : [],
  });

  await saveConfig(config);

  // Write agent file
  const agentFile = `import { defineAgent } from "@/lib/engine";

export default defineAgent({
  id: "${id}",
  name: "${name}",
  role: "${role}",
  model: "${model}",
  systemPrompt: ${JSON.stringify(systemPrompt)},
  channels: ["web_chat"],
  tools: [],
});
`;
  const agentsDir = path.resolve(process.cwd(), "agents");
  await fs.mkdirp(agentsDir);
  await fs.writeFile(path.join(agentsDir, `${id}.ts`), agentFile);

  // Update agents/index.ts
  await updateAgentRegistry(config);

  p.log.success(`Added ${chalk.bold(name)} (${role})`);
  p.outro(chalk.dim(`Agent file: agents/${id}.ts`));
}

async function agentRemove(idArg?: string) {
  const config = await loadConfigOrExit();

  if (config.agents.length === 0) {
    p.log.error("No agents to remove.");
    return;
  }

  let targetId = idArg;

  if (!targetId) {
    console.log();
    const choice = await p.select({
      message: "Which agent to remove?",
      options: config.agents.map((a) => ({
        value: a.id,
        label: `${a.name} (${a.role})`,
      })),
    });

    if (p.isCancel(choice)) {
      p.cancel("Cancelled.");
      return;
    }
    targetId = choice as string;
  }

  const agent = config.agents.find((a) => a.id === targetId);
  if (!agent) {
    p.log.error(`Agent "${targetId}" not found.`);
    process.exit(1);
  }

  const confirm = await p.confirm({
    message: `Remove ${agent.name} (${agent.role})?`,
    initialValue: false,
  });

  if (p.isCancel(confirm) || !confirm) {
    p.cancel("Cancelled.");
    return;
  }

  // Remove from config
  config.agents = config.agents.filter((a) => a.id !== targetId);
  await saveConfig(config);

  // Remove agent file
  const agentPath = path.resolve(process.cwd(), "agents", `${targetId}.ts`);
  if (await fs.pathExists(agentPath)) {
    await fs.remove(agentPath);
  }

  // Update registry
  await updateAgentRegistry(config);

  p.log.success(`Removed ${chalk.bold(agent.name)}`);
}

async function updateAgentRegistry(config: { agents: { id: string }[] }) {
  const agentsDir = path.resolve(process.cwd(), "agents");
  const indexPath = path.join(agentsDir, "index.ts");

  const imports = config.agents
    .map((a) => `import ${a.id} from "./${a.id}.js";`)
    .join("\n");
  const exports = config.agents.map((a) => `  ${a.id}`).join(",\n");

  await fs.writeFile(
    indexPath,
    `${imports}\n\nexport const agents = {\n${exports},\n};\n`
  );
}
