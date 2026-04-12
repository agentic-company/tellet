import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { registerTools } from "./tools.js";

export async function startMcpServer() {
  const server = new McpServer(
    {
      name: "tellet",
      version: "0.11.0",
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
