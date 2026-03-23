import OpenAI from "openai";
import type { LLMProvider, StreamParams, StreamChunk } from "./index";

let _client: OpenAI | null = null;
function getClient() {
  if (!_client) _client = new OpenAI();
  return _client;
}

export const openaiProvider: LLMProvider = {
  id: "openai",

  async stream(params: StreamParams): Promise<ReadableStream<StreamChunk>> {
    const stream = await getClient().chat.completions.create({
      model: params.model,
      max_tokens: params.maxTokens || 2048,
      messages: [
        { role: "system", content: params.system },
        ...params.messages,
      ],
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            controller.enqueue({ text });
          }
        }
        controller.close();
      },
    });
  },

  estimateCost(inputTokens: number, outputTokens: number, model: string): number {
    const rates: Record<string, { input: number; output: number }> = {
      "gpt-4.1": { input: 2, output: 8 },
      "gpt-4.1-mini": { input: 0.4, output: 1.6 },
      "gpt-4.1-nano": { input: 0.1, output: 0.4 },
    };
    const r = rates[model] || rates["gpt-4.1"];
    return (inputTokens * r.input + outputTokens * r.output) / 1_000_000;
  },
};
