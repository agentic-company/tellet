import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { registerTools } from "./tools.js";

async function getVersion(): Promise<string> {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const pkg = await fs.readJSON(path.resolve(__dirname, "..", "..", "package.json"));
  return pkg.version;
}

export async function startMcpServer() {
  const version = await getVersion();

  const server = new McpServer(
    {
      name: "tellet",
      version,
    },
    {
      instructions:
        "Tellet MCP server — manage AI agent projects. " +
        "Use these tools inside a tellet project directory (one containing tellet.json). " +
        "Tools: project_status, agent_list, agent_add, agent_remove, config_read, dev_start, deploy_info.",
    }
  );

  registerTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
