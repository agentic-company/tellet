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
 * Load tellet.json from CWD or throw with helpful message.
 */
export async function loadConfig(): Promise<TelletConfig> {
  const configPath = path.resolve(process.cwd(), "tellet.json");

  if (!(await fs.pathExists(configPath))) {
    console.error(
      chalk.red("  No tellet.json found in current directory.\n") +
        chalk.dim("  Run this command from inside a tellet project, or create one:\n") +
        chalk.cyan("  npx @tellet/create")
    );
    process.exit(1);
  }

  return fs.readJSON(configPath);
}

/**
 * Save tellet.json back to CWD.
 */
export async function saveConfig(config: TelletConfig): Promise<void> {
  const configPath = path.resolve(process.cwd(), "tellet.json");
  await fs.writeJSON(configPath, config, { spaces: 2 });
}

/**
 * Require that CWD is a tellet project (has tellet.json).
 */
export function requireProject(fn: (args: string[]) => Promise<void>) {
  return async (args: string[]) => {
    await loadConfig(); // validates existence, exits if missing
    return fn(args);
  };
}
