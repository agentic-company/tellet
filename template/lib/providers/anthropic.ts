import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, StreamParams, StreamChunk } from "./index";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic();
  return _client;
}

export const anthropicProvider: LLMProvider = {
  id: "anthropic",

  async stream(params: StreamParams): Promise<ReadableStream<StreamChunk>> {
    const stream = getClient().messages.stream({
      model: params.model,
      max_tokens: params.maxTokens || 2048,
      system: params.system,
      messages: params.messages,
    });

    return new ReadableStream({
      async start(controller) {
        stream.on("text", (text) => {
          controller.enqueue({ text });
        });
        await stream.finalMessage();
        controller.close();
      },
    });
  },

  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    const rates: Record<string, { input: number; output: number }> = {
      "claude-sonnet-4-6": { input: 3, output: 15 },
      "claude-haiku-4-5": { input: 0.25, output: 1.25 },
      "claude-opus-4-6": { input: 15, output: 75 },
    };
    const r = rates[model] || rates["claude-sonnet-4-6"];
    return (inputTokens * r.input + outputTokens * r.output) / 1_000_000;
  },
};
