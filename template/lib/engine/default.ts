import { getProvider } from "@/lib/providers";
import type { AgentConfig } from "./index";

export async function streamAgent(
  agent: AgentConfig,
  messages: { role: "user" | "assistant"; content: string }[]
) {
  const provider = getProvider(agent.provider);
  return provider.stream({
    model: agent.model,
    system: agent.systemPrompt,
    messages,
  });
}
