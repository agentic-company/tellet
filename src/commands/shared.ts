import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export interface TelletConfig {
  version: string;
  company: {
    name: string;
    description: string;
    industry: string;
  };
  engine: string;
  llm: {
    provider: string;
    defaultModel: string;
    fallback: string | null;
  };
  agents: {
    id: string;
    name: string;
    role: string;
    model: string;
    channels: string[];
    tools: string[];
  }[];
  tools: Record<string, { type: string; description: string }>;
  channels: Record<string, { enabled: boolean }>;
  mode: string;
  storage: string;
  integrations: string[];
  websiteUrl?: string;
  site?: Record<string, unknown>;
}

/**
 * Load tellet.json from CWD. Throws if not found.
 */
export async function loadConfig(): Promise<TelletConfig> {
  const configPath = path.resolve(process.cwd(), "tellet.json");

  if (!(await fs.pathExists(configPath))) {
    throw new Error("No tellet.json found in current directory.");
  }

  return fs.readJSON(configPath);
}

/**
 * Load tellet.json from CWD with pretty error + exit (for CLI commands only).
 */
export async function loadConfigOrExit(): Promise<TelletConfig> {
  try {
    return await loadConfig();
  } catch {
    console.error(
      chalk.red("  No tellet.json found in current directory.\n") +
        chalk.dim("  Run this command from inside a tellet project, or create one:\n") +
        chalk.cyan("  npx @tellet/create")
    );
    process.exit(1);
  }
}

/**
 * Save tellet.json back to CWD.
 */
export async function saveConfig(config: TelletConfig): Promise<void> {
  const configPath = path.resolve(process.cwd(), "tellet.json");
  await fs.writeJSON(configPath, config, { spaces: 2 });
}

/**
 * Normalize a display name to a safe identifier.
 * Returns empty string if input has no alphanumeric characters.
 */
export function nameToId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Generate an agent .ts file with properly escaped values.
 */
export function generateAgentFile(agent: {
  id: string;
  name: string;
  role: string;
  model: string;
  systemPrompt: string;
}): string {
  return `import { defineAgent } from "@/lib/engine";

export default defineAgent({
  id: ${JSON.stringify(agent.id)},
  name: ${JSON.stringify(agent.name)},
  role: ${JSON.stringify(agent.role)},
  model: ${JSON.stringify(agent.model)},
  systemPrompt: ${JSON.stringify(agent.systemPrompt)},
  channels: ["web_chat"],
  tools: [],
});
`;
}

/**
 * Rewrite agents/index.ts registry to match config.
 */
export async function updateAgentRegistry(config: { agents: { id: string }[] }): Promise<void> {
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
