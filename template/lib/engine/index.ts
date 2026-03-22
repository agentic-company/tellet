export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  model: string;
  provider?: string;
  systemPrompt: string;
  channels: string[];
  tools: string[];
}

export function defineAgent(config: AgentConfig): AgentConfig {
  return config;
}

export { streamAgent } from "./default";
