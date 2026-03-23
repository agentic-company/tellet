import Anthropic from "@anthropic-ai/sdk";

interface GeneratedAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  model: string;
}

interface SiteFeature {
  title: string;
  description: string;
  icon: string;
}

interface SiteFAQ {
  question: string;
  answer: string;
}

interface SiteContent {
  tagline: string;
  subtitle: string;
  features: SiteFeature[];
  faq: SiteFAQ[];
  cta: string;
}

interface GenerateResult {
  industry: string;
  summary: string;
  agents: GeneratedAgent[];
  site: SiteContent;
}

const SYSTEM_PROMPT = `You are an AI company architect. Given a business description, generate a team of AI agents AND website content tailored for that specific business.

Rules for AGENTS:
1. Generate 3-5 agents appropriate for the business
2. Always include a customer_support agent
3. Each agent needs a unique, memorable name related to the business theme
4. Each system_prompt must be detailed (200+ words) and specific to THIS business — include the company name, products, customer demographics, tone of voice
5. Assign appropriate models: use "claude-haiku-4-5" for high-volume simple tasks (CS), "claude-sonnet-4-6" for creative/complex tasks (marketing, sales)
6. The id should be lowercase, no spaces

Rules for SITE CONTENT:
1. tagline: a punchy one-liner (max 8 words) that captures the business value
2. subtitle: 1-2 sentences expanding on the tagline, mentioning who the business serves
3. features: 4-6 business features/benefits (NOT technical features). Each needs a title (3-5 words), description (1 sentence), and icon (one of: sparkles, shield, zap, heart, globe, chart, clock, users, star, target)
4. faq: 4-5 frequently asked questions a customer would ask, with concise answers
5. cta: a short call-to-action phrase (e.g. "Start your journey today")

Output ONLY valid JSON matching this schema:
{
  "industry": "string",
  "summary": "string — one-line business summary",
  "agents": [
    {
      "id": "string",
      "name": "string",
      "role": "string — one of: customer_support, marketing, sales, operations, development, analytics",
      "description": "string — one sentence",
      "systemPrompt": "string — detailed system prompt",
      "model": "string — claude-haiku-4-5 or claude-sonnet-4-6"
    }
  ],
  "site": {
    "tagline": "string",
    "subtitle": "string",
    "features": [
      { "title": "string", "description": "string", "icon": "string" }
    ],
    "faq": [
      { "question": "string", "answer": "string" }
    ],
    "cta": "string"
  }
}`;

export async function generateAgents(
  companyName: string,
  businessDescription: string
): Promise<GenerateResult> {
  const anthropic = new Anthropic();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
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

    // Ensure site content exists with defaults
    if (!result.site) {
      result.site = {
        tagline: `${companyName} — Powered by AI`,
        subtitle: result.summary || businessDescription,
        features: [],
        faq: [],
        cta: "Get started today",
      };
    }

    return result;
  } catch {
    throw new Error(
      "Failed to parse AI response. Please try again."
    );
  }
}
