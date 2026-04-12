import fs from "fs-extra";
import path from "path";

interface EnvOptions {
  anthropicKey: string;
  openaiKey?: string;
  supabaseUrl: string;
  supabaseKey: string;
  serviceRoleKey?: string;
}

/** Escape a value for .env files — wrap in quotes if it contains special chars. */
function envQuote(v: string): string {
  if (/[\s#"'\\$`!]/.test(v) || v.includes("\n")) {
    return `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`;
  }
  return v;
}

/**
 * Write (or overwrite) the .env.local file with Supabase + API credentials.
 */
export async function writeEnvFile(
  projectDir: string,
  options: EnvOptions
): Promise<void> {
  const lines = [
    `# Orchestrator (always Anthropic)`,
    `ANTHROPIC_API_KEY=${envQuote(options.anthropicKey)}`,
  ];

  if (options.openaiKey) {
    lines.push(`OPENAI_API_KEY=${envQuote(options.openaiKey)}`);
  }

  lines.push(
    ``,
    `# Supabase`,
    `NEXT_PUBLIC_SUPABASE_URL=${envQuote(options.supabaseUrl)}`,
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${envQuote(options.supabaseKey)}`
  );

  if (options.serviceRoleKey) {
    lines.push(`SUPABASE_SERVICE_ROLE_KEY=${envQuote(options.serviceRoleKey)}`);
  }

  await fs.writeFile(
    path.join(projectDir, ".env.local"),
    lines.join("\n") + "\n"
  );
}
