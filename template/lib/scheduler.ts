import { getConfig } from "./tellet";
import { streamAgentWithTools } from "./engine";
import { searchKnowledge } from "./mcp/knowledge";
import { createServerSupabase } from "./supabase";
import type Anthropic from "@anthropic-ai/sdk";

interface ScheduleResult {
  agentId: string;
  agentName: string;
  task: string;
  response: string;
  timestamp: string;
}

const builtinTools = [
  {
    name: "search_knowledge",
    description: "Search the company knowledge base",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    } as Anthropic.Tool.InputSchema,
    execute: async (input: Record<string, unknown>) => {
      return searchKnowledge(input.query as string);
    },
  },
];

export async function runScheduledAgent(
  agentId: string,
  task?: string
): Promise<ScheduleResult> {
  const config = getConfig();
  const supabase = await createServerSupabase();

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .single();

  if (!agent) throw new Error(`Agent "${agentId}" not found`);

  const agentConfig = config.agents.find((a) => a.id === agentId);
  const prompt =
    task ||
    (agentConfig as { schedule?: { task?: string } })?.schedule?.task ||
    `Perform your regular scheduled duties as ${agent.role}.`;

  const stream = await streamAgentWithTools({
    agent: {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      model: agent.model,
      provider: agent.config?.provider as string | undefined,
      systemPrompt: agent.system_prompt,
      channels: [],
      tools: agent.config?.tools || [],
    },
    messages: [{ role: "user", content: prompt }],
    builtinTools,
  });

  let response = "";
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    response += value.text;
  }

  // Log activity
  await supabase.from("activity_log").insert({
    agent_id: agentId,
    action: "scheduled_task",
    summary: `[Scheduled] ${response.slice(0, 120)}${response.length > 120 ? "..." : ""}`,
  });

  return {
    agentId,
    agentName: agent.name,
    task: prompt,
    response,
    timestamp: new Date().toISOString(),
  };
}

export async function runAllScheduledAgents(): Promise<ScheduleResult[]> {
  const config = getConfig();
  const results: ScheduleResult[] = [];

  for (const agent of config.agents) {
    const schedule = (agent as { schedule?: { enabled?: boolean } }).schedule;
    if (!schedule?.enabled) continue;

    try {
      const result = await runScheduledAgent(agent.id);
      results.push(result);
    } catch (err) {
      results.push({
        agentId: agent.id,
        agentName: agent.name,
        task: "scheduled",
        response: `Error: ${err instanceof Error ? err.message : "Failed"}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return results;
}
