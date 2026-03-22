export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface StreamParams {
  model: string;
  system: string;
  messages: LLMMessage[];
  maxTokens?: number;
}

export interface StreamChunk {
  text: string;
}

export interface LLMProvider {
  id: string;
  stream(params: StreamParams): Promise<ReadableStream<StreamChunk>>;
  estimateCost(inputTokens: number, outputTokens: number, model: string): number;
}

import { anthropicProvider } from "./anthropic";

const providers: Record<string, LLMProvider> = {
  anthropic: anthropicProvider,
};

export function getProvider(id?: string): LLMProvider {
  const providerId = id || "anthropic";
  const provider = providers[providerId];
  if (!provider) throw new Error(`Unknown LLM provider: ${providerId}`);
  return provider;
}
