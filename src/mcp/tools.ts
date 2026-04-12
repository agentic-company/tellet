import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "fs-extra";
import path from "path";
import { spawn } from "child_process";
import {
  loadConfig,
  saveConfig,
  nameToId,
  generateAgentFile,
  updateAgentRegistry,
  type TelletConfig,
} from "../commands/shared.js";

const VALID_ROLES = [
  "customer_support",
  "sales",
  "marketing",
  "operations",
  "analytics",
  "development",
] as const;

export function registerTools(server: McpServer) {
  // ─── project_status ───────────────────────────────────
  server.registerTool(
    "project_status",
    {
      title: "Project Status",
      description:
        "Show tellet project status: company info, agents, channels, LLM config, and environment health.",
      inputSchema: z.object({}),
    },
    async () => {
      const config = await tryLoadConfig();
      if (!config) return configError();

      const envPath = path.resolve(process.cwd(), ".env.local");
      const envExists = await fs.pathExists(envPath);
      const nodeModules = await fs.pathExists(
        path.resolve(process.cwd(), "node_modules")
      );

      const enabledChannels = Object.entries(config.channels)
        .filter(([, v]) => v.enabled)
        .map(([k]) => k);

      const text = [
        `Company: ${config.company.name}`,
        `Industry: ${config.company.industry}`,
        `Mode: ${config.mode}`,
        `Provider: ${config.llm.provider} (${config.llm.defaultModel})`,
        `Agents: ${config.agents.length} (${config.agents.map((a) => a.name).join(", ")})`,
        `Channels: ${enabledChannels.join(", ") || "none"}`,
        `Storage: ${config.storage}`,
        `.env.local: ${envExists ? "found" : "MISSING"}`,
        `node_modules: ${nodeModules ? "installed" : "NOT INSTALLED"}`,
      ].join("\n");

      return { content: [{ type: "text" as const, text }] };
    }
  );

  // ─── agent_list ───────────────────────────────────────
  server.registerTool(
    "agent_list",
    {
      title: "List Agents",
      description: "List all agents in the tellet project with their roles, models, channels, and tools.",
      inputSchema: z.object({}),
    },
    async () => {
      const config = await tryLoadConfig();
      if (!config) return configError();

      if (config.agents.length === 0) {
        return { content: [{ type: "text" as const, text: "No agents configured." }] };
      }

      const lines = config.agents.map((a) =>
        [
          `- ${a.name} (${a.id})`,
          `  Role: ${a.role}`,
          `  Model: ${a.model}`,
          `  Channels: ${a.channels.join(", ")}`,
          `  Tools: ${a.tools.length > 0 ? a.tools.join(", ") : "none"}`,
        ].join("\n")
      );

      return { content: [{ type: "text" as const, text: lines.join("\n\n") }] };
    }
  );

  // ─── agent_add ────────────────────────────────────────
  server.registerTool(
    "agent_add",
    {
      title: "Add Agent",
      description:
        "Add a new AI agent to the tellet project. Updates tellet.json, creates the agent file, and updates the registry.",
      inputSchema: z.object({
        name: z.string().describe("Agent display name (e.g. Luna, Atlas)"),
        role: z
          .enum(VALID_ROLES)
          .describe("Agent role"),
        description: z
          .string()
          .describe("What this agent does (used in system prompt)"),
      }),
    },
    async ({ name, role, description }) => {
      const config = await tryLoadConfig();
      if (!config) return configError();

      const id = nameToId(name);

      if (!id) {
        return {
          content: [{ type: "text" as const, text: "Error: Name must contain at least one letter or number." }],
          isError: true,
        };
      }

      if (config.agents.some((a) => a.id === id)) {
        return {
          content: [{ type: "text" as const, text: `Error: Agent "${id}" already exists.` }],
          isError: true,
        };
      }

      const model = config.llm.defaultModel;
      const systemPrompt = `You are ${name}, the ${role.replace(/_/g, " ")} agent for ${config.company.name}. ${description}`;

      config.agents.push({
        id,
        name,
        role,
        model,
        channels: ["web_chat"],
        tools: role === "customer_support" ? ["search_knowledge"] : [],
      });

      await saveConfig(config);

      const agentsDir = path.resolve(process.cwd(), "agents");
      await fs.mkdirp(agentsDir);
      await fs.writeFile(
        path.join(agentsDir, `${id}.ts`),
        generateAgentFile({ id, name, role, model, systemPrompt })
      );

      await updateAgentRegistry(config);

      return {
        content: [
          {
            type: "text" as const,
            text: `Added agent "${name}" (${role})\nID: ${id}\nFile: agents/${id}.ts\nTotal agents: ${config.agents.length}`,
          },
        ],
      };
    }
  );

  // ─── agent_remove ─────────────────────────────────────
  server.registerTool(
    "agent_remove",
    {
      title: "Remove Agent",
      description: "Remove an agent from the tellet project by ID.",
      inputSchema: z.object({
        id: z.string().describe("Agent ID to remove"),
      }),
    },
    async ({ id }) => {
      const config = await tryLoadConfig();
      if (!config) return configError();

      const agent = config.agents.find((a) => a.id === id);
      if (!agent) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: Agent "${id}" not found. Available: ${config.agents.map((a) => a.id).join(", ")}`,
            },
          ],
          isError: true,
        };
      }

      config.agents = config.agents.filter((a) => a.id !== id);
      await saveConfig(config);

      const agentPath = path.resolve(process.cwd(), "agents", `${id}.ts`);
      if (await fs.pathExists(agentPath)) {
        await fs.remove(agentPath);
      }

      await updateAgentRegistry(config);

      return {
        content: [
          {
            type: "text" as const,
            text: `Removed agent "${agent.name}" (${id})\nRemaining agents: ${config.agents.length}`,
          },
        ],
      };
    }
  );

  // ─── config_read ──────────────────────────────────────
  server.registerTool(
    "config_read",
    {
      title: "Read Config",
      description: "Read the full tellet.json configuration file.",
      inputSchema: z.object({}),
    },
    async () => {
      const configPath = path.resolve(process.cwd(), "tellet.json");
      if (!(await fs.pathExists(configPath))) {
        return configError();
      }
      const raw = await fs.readFile(configPath, "utf-8");
      return { content: [{ type: "text" as const, text: raw }] };
    }
  );

  // ─── dev_start ────────────────────────────────────────
  server.registerTool(
    "dev_start",
    {
      title: "Start Dev Server",
      description:
        "Start the Next.js development server (next dev). Launches in the background — success means the process was spawned, not that the server is healthy.",
      inputSchema: z.object({
        port: z
          .number()
          .int()
          .min(1024)
          .max(65535)
          .optional()
          .describe("Port number (default: 3000)"),
      }),
    },
    async ({ port }) => {
      const config = await tryLoadConfig();
      if (!config) return configError();

      const nodeModules = await fs.pathExists(
        path.resolve(process.cwd(), "node_modules")
      );
      if (!nodeModules) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Error: node_modules not found. Run npm install first.",
            },
          ],
          isError: true,
        };
      }

      const args = ["next", "dev"];
      if (port) args.push("--port", String(port));

      const child = spawn("npx", args, {
        cwd: process.cwd(),
        detached: true,
        stdio: "ignore",
      });
      child.unref();

      const actualPort = port || 3000;
      return {
        content: [
          {
            type: "text" as const,
            text: `Dev server spawned for ${config.company.name} on http://localhost:${actualPort}\nPID: ${child.pid}\nNote: Check the port is not already in use.`,
          },
        ],
      };
    }
  );

  // ─── deploy_info ──────────────────────────────────────
  server.registerTool(
    "deploy_info",
    {
      title: "Deploy Info",
      description: "Show deployment options and commands based on the project structure.",
      inputSchema: z.object({}),
    },
    async () => {
      const config = await tryLoadConfig();
      if (!config) return configError();

      const cwd = process.cwd();
      const hasInfra = await fs.pathExists(path.join(cwd, "infra"));
      const hasDocker = await fs.pathExists(path.join(cwd, "docker-compose.yml"));
      const hasRailway = await fs.pathExists(path.join(cwd, "railway.toml"));

      const options: string[] = [];

      options.push(
        "## Vercel (recommended for Quick Start)",
        "```",
        "npx vercel",
        "```",
        ""
      );

      if (hasRailway || hasDocker) {
        options.push(
          "## Railway",
          "```",
          "railway login",
          "railway init",
          "railway add --plugin postgresql",
          "railway up",
          "```",
          ""
        );
      }

      if (hasDocker) {
        options.push(
          "## Docker",
          "```",
          "docker build -t tellet .",
          "docker compose up -d",
          "```",
          "Works with Render, Fly.io, DigitalOcean, or any Docker host.",
          ""
        );
      }

      if (hasInfra) {
        options.push(
          "## AWS CDK",
          "```",
          "cd infra && npm install",
          "npx cdk bootstrap  # first time only",
          "npx cdk deploy",
          "```",
          ""
        );
      }

      return { content: [{ type: "text" as const, text: options.join("\n") }] };
    }
  );
}

// ─── Helpers ──────────────────────────────────────────

async function tryLoadConfig(): Promise<TelletConfig | null> {
  try {
    return await loadConfig();
  } catch {
    return null;
  }
}

function configError() {
  return {
    content: [
      {
        type: "text" as const,
        text: "No tellet.json found in current directory. Make sure the MCP server is running from inside a tellet project.",
      },
    ],
    isError: true,
  };
}
