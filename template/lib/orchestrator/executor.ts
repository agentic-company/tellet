import { createServerSupabase } from "@/lib/supabase";
import { addDocument, searchKnowledge, listDocuments, deleteDocument } from "@/lib/mcp/knowledge";
import { runScheduledAgent } from "@/lib/scheduler";
import { TOOL_REGISTRY, getToolById } from "@/lib/mcp/registry";
import fs from "fs";
import path from "path";

export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  const supabase = await createServerSupabase();

  switch (name) {
    case "list_agents": {
      const { data } = await supabase
        .from("agents")
        .select("id, name, role, status, model")
        .order("created_at");
      return JSON.stringify(data || []);
    }

    case "get_stats": {
      const [
        { count: conversations },
        { count: messages },
        { data: agents },
        { data: costData },
      ] = await Promise.all([
        supabase.from("conversations").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("agents").select("id, status"),
        supabase.from("activity_log").select("cost_usd"),
      ]);
      const activeAgents = (agents || []).filter((a) => a.status === "active").length;
      const totalCost = (costData || []).reduce(
        (sum, r) => sum + Number(r.cost_usd || 0),
        0
      );
      return JSON.stringify({
        conversations: conversations || 0,
        messages: messages || 0,
        activeAgents,
        totalAgents: agents?.length || 0,
        estimatedCost: `$${totalCost.toFixed(2)}`,
      });
    }

    case "update_agent_prompt": {
      const { agent_id, system_prompt } = input as {
        agent_id: string;
        system_prompt: string;
      };
      const { error } = await supabase
        .from("agents")
        .update({ system_prompt })
        .eq("id", agent_id);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, agent_id });
    }

    case "update_site_content": {
      const configPath = path.join(process.cwd(), "tellet.json");
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      const updates = input as Record<string, unknown>;
      if (updates.tagline) config.site.tagline = updates.tagline;
      if (updates.subtitle) config.site.subtitle = updates.subtitle;
      if (updates.cta) config.site.cta = updates.cta;
      if (updates.features) config.site.features = updates.features;
      if (updates.faq) config.site.faq = updates.faq;

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return JSON.stringify({
        success: true,
        message: "Site content updated. Rebuild to see changes.",
      });
    }

    case "get_recent_conversations": {
      const limit = (input.limit as number) || 10;
      const { data } = await supabase
        .from("conversations")
        .select("id, channel, created_at, agents(name, role), messages(count)")
        .order("created_at", { ascending: false })
        .limit(limit);
      return JSON.stringify(data || []);
    }

    case "add_knowledge": {
      const { title, content, category } = input as {
        title: string;
        content: string;
        category?: string;
      };
      return addDocument(title, content, category);
    }

    case "search_knowledge": {
      return searchKnowledge(input.query as string);
    }

    case "list_knowledge": {
      return listDocuments();
    }

    case "delete_knowledge": {
      return deleteDocument(input.document_id as string);
    }

    case "run_agent_task": {
      const result = await runScheduledAgent(
        input.agent_id as string,
        input.task as string
      );
      return JSON.stringify(result);
    }

    case "manage_schedule": {
      const configPath = path.join(process.cwd(), "tellet.json");
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      const agentIdx = config.agents.findIndex(
        (a: { id: string }) => a.id === input.agent_id
      );
      if (agentIdx === -1) return JSON.stringify({ error: "Agent not found" });

      config.agents[agentIdx].schedule = {
        enabled: input.enabled as boolean,
        cron: (input.cron as string) || config.agents[agentIdx].schedule?.cron || "0 9 * * *",
        task: (input.task as string) || config.agents[agentIdx].schedule?.task || "",
      };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return JSON.stringify({ success: true, schedule: config.agents[agentIdx].schedule });
    }

    case "list_available_tools": {
      return JSON.stringify(
        TOOL_REGISTRY.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          requiredKeys: t.envKeys.map((k) => k.key),
          compatibleRoles: t.compatibleRoles,
        }))
      );
    }

    case "install_tool": {
      const toolId = input.tool_id as string;
      const agentIds = (input.agent_ids as string[]) || [];
      const tool = getToolById(toolId);
      if (!tool) return JSON.stringify({ error: `Tool "${toolId}" not found in marketplace` });

      const configPath = path.join(process.cwd(), "tellet.json");
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      // Add tool to tools section
      if (!config.tools) config.tools = {};
      config.tools[toolId] = {
        type: "mcp",
        package: tool.package,
        description: tool.description,
        env: Object.fromEntries(tool.envKeys.map((k) => [k.key, `\${${k.key}}`])),
      };

      // Assign to agents
      if (agentIds.length > 0) {
        for (const aid of agentIds) {
          const agent = config.agents.find((a: { id: string }) => a.id === aid);
          if (agent) {
            if (!agent.tools) agent.tools = [];
            if (!agent.tools.includes(toolId)) agent.tools.push(toolId);
          }
        }
      } else {
        // Auto-assign to compatible agents
        for (const agent of config.agents) {
          if (tool.compatibleRoles.includes(agent.role)) {
            if (!agent.tools) agent.tools = [];
            if (!agent.tools.includes(toolId)) agent.tools.push(toolId);
          }
        }
      }

      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const envInstructions = tool.envKeys
        .map((k) => `  ${k.key}=${k.placeholder}`)
        .join("\n");

      return JSON.stringify({
        success: true,
        tool: tool.name,
        message: `Installed ${tool.name}. Add these to your .env:\n${envInstructions}`,
      });
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}
