/**
 * Tool Registry — pre-defined MCP tools that can be added to tellet.
 *
 * Usage via Orchestrator: "Add Stripe to my agents"
 * Usage via CLI: tool selection during setup
 */

export interface ToolRegistryEntry {
  id: string;
  name: string;
  description: string;
  package: string;
  envKeys: { key: string; description: string; placeholder: string }[];
  compatibleRoles: string[];
  category: string;
}

export const TOOL_REGISTRY: ToolRegistryEntry[] = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Accept payments, create invoices, manage subscriptions",
    package: "@stripe/mcp",
    envKeys: [
      {
        key: "STRIPE_SECRET_KEY",
        description: "Stripe secret key (use restricted key for safety)",
        placeholder: "rk_live_...",
      },
    ],
    compatibleRoles: ["sales", "customer_support", "operations"],
    category: "payments",
  },
  {
    id: "email",
    name: "Email (Resend)",
    description: "Send emails, manage contacts, campaigns",
    package: "resend-mcp",
    envKeys: [
      {
        key: "RESEND_API_KEY",
        description: "Resend API key",
        placeholder: "re_...",
      },
    ],
    compatibleRoles: ["marketing", "customer_support", "sales"],
    category: "communication",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Manage repos, issues, PRs",
    package: "@modelcontextprotocol/server-github",
    envKeys: [
      {
        key: "GITHUB_TOKEN",
        description: "GitHub personal access token",
        placeholder: "ghp_...",
      },
    ],
    compatibleRoles: ["development", "operations"],
    category: "development",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send messages, manage channels",
    package: "@anthropic-ai/mcp-server-slack",
    envKeys: [
      {
        key: "SLACK_BOT_TOKEN",
        description: "Slack bot token",
        placeholder: "xoxb-...",
      },
    ],
    compatibleRoles: ["customer_support", "marketing", "operations"],
    category: "communication",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Manage pages, databases, documents",
    package: "@anthropic-ai/mcp-server-notion",
    envKeys: [
      {
        key: "NOTION_API_KEY",
        description: "Notion integration token",
        placeholder: "ntn_...",
      },
    ],
    compatibleRoles: ["operations", "marketing", "development"],
    category: "productivity",
  },
];

export function getToolById(id: string): ToolRegistryEntry | undefined {
  return TOOL_REGISTRY.find((t) => t.id === id);
}

export function getToolsByCategory(category: string): ToolRegistryEntry[] {
  return TOOL_REGISTRY.filter((t) => t.category === category);
}

export function getToolsForRole(role: string): ToolRegistryEntry[] {
  return TOOL_REGISTRY.filter((t) => t.compatibleRoles.includes(role));
}
