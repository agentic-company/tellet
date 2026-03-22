import Anthropic from "@anthropic-ai/sdk";

interface GeneratedAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  model: string;
}

interface GenerateResult {
  industry: string;
  summary: string;
  agents: GeneratedAgent[];
}

const SYSTEM_PROMPT = `You are an AI company architect. Given a business description, generate a team of AI agents tailored for that specific business.

Rules:
1. Generate 3-5 agents appropriate for the business
2. Always include a customer_support agent
3. Each agent needs a unique, memorable name related to the business theme
4. Each system_prompt must be detailed (200+ words) and specific to THIS business — include the company name, products, customer demographics, tone of voice
5. Assign appropriate models: use "claude-haiku-4-5" for high-volume simple tasks (CS), "claude-sonnet-4-6" for creative/complex tasks (marketing, sales)
6. The id should be lowercase, no spaces

Output ONLY valid JSON matching this schema:
{
  "industry": "string — business category",
  "summary": "string — one-line business summary",
  "agents": [
    {
      "id": "string",
      "name": "string",
      "role": "string — one of: customer_support, marketing, sales, operations, development, analytics",
      "description": "string — one sentence describing what this agent does",
      "systemPrompt": "string — detailed system prompt for this agent",
      "model": "string — claude-haiku-4-5 or claude-sonnet-4-6"
    }
  ]
}`;

export async function generateAgents(
  companyName: string,
  businessDescription: string
): Promise<GenerateResult> {
  const anthropic = new Anthropic();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Company: ${companyName}\n\nBusiness Description: ${businessDescription}`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = (jsonMatch[1] || text).trim();

  try {
    const result = JSON.parse(jsonStr) as GenerateResult;

    if (!result.agents || result.agents.length === 0) {
      throw new Error("No agents generated");
    }

    return result;
  } catch {
    throw new Error(
      "Failed to parse AI response. Please try again."
    );
  }
}
