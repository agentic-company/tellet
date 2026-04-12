import { execFileSync, spawnSync } from "child_process";
import * as p from "@clack/prompts";
import chalk from "chalk";

/** Check if the Supabase CLI is installed and accessible. */
export function hasSupabaseCLI(): boolean {
  try {
    execFileSync("supabase", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Check if Docker is running (required for `supabase start`). */
export function hasDocker(): boolean {
  try {
    execFileSync("docker", ["info"], { stdio: "ignore", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

/**
 * Parse `supabase status` output to extract local dev credentials.
 * The output format is like:
 *   API URL: http://127.0.0.1:54321
 *   anon key: eyJ...
 *   service_role key: eyJ...
 */
function parseSupabaseStatus(output: string): SupabaseCredentials | null {
  const urlMatch = output.match(/API URL:\s*(http\S+)/);
  const anonMatch = output.match(/anon key:\s*(\S+)/);
  const serviceMatch = output.match(/service_role key:\s*(\S+)/);

  if (!urlMatch || !anonMatch) return null;

  return {
    url: urlMatch[1],
    anonKey: anonMatch[1],
    serviceRoleKey: serviceMatch?.[1],
  };
}

/**
 * Run supabase CLI command in a directory, returning stdout.
 */
function runSupabase(args: string[], cwd: string): string {
  return execFileSync("supabase", args, {
    cwd,
    encoding: "utf-8",
    timeout: 120_000,
  });
}

/**
 * Run supabase CLI with live stdio (visible to user).
 * Returns the exit code.
 */
function runSupabaseLive(args: string[], cwd: string): number {
  const result = spawnSync("supabase", args, {
    cwd,
    stdio: "inherit",
    timeout: 300_000,
  });
  return result.status ?? 1;
}

/**
 * Initialize Supabase in the project directory.
 * Creates supabase/config.toml if not already present.
 */
export function supabaseInit(projectDir: string): boolean {
  try {
    runSupabase(
      ["init", "--with-intellij-settings=false", "--with-vscode-settings=false"],
      projectDir
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Start local Supabase (Docker containers).
 * Returns credentials on success, null on failure.
 */
export async function supabaseStartLocal(
  projectDir: string
): Promise<SupabaseCredentials | null> {
  p.log.info(chalk.dim("Starting local Supabase (this may take a minute on first run)..."));

  const code = runSupabaseLive(["start"], projectDir);
  if (code !== 0) {
    p.log.error("Failed to start local Supabase.");
    return null;
  }

  p.log.success("Local Supabase is running!");

  // Extract credentials from status
  try {
    const output = runSupabase(["status"], projectDir);
    return parseSupabaseStatus(output);
  } catch {
    return null;
  }
}

/**
 * Link to a remote Supabase project.
 * Prompts for project ref, runs `supabase link`.
 */
export async function supabaseLinkRemote(
  projectDir: string
): Promise<boolean> {
  const refInput = await p.text({
    message: "Supabase project ref (from Dashboard → Settings → General):",
    placeholder: "abcdefghijklmnopqrst",
    validate: (v) =>
      !v || v.length < 10
        ? "Please enter a valid project ref"
        : undefined,
  });

  if (p.isCancel(refInput)) return false;

  p.log.info(chalk.dim("Linking to Supabase project (follow the prompts below)..."));

  const code = runSupabaseLive(
    ["link", "--project-ref", refInput as string],
    projectDir
  );

  if (code !== 0) {
    p.log.error("Failed to link project.");
    return false;
  }

  p.log.success("Linked to Supabase project!");
  return true;
}

/**
 * Push migrations to the database.
 */
export async function supabasePushMigrations(
  projectDir: string
): Promise<boolean> {
  p.log.info(chalk.dim("Applying database migrations..."));

  const code = runSupabaseLive(["db", "push"], projectDir);

  if (code !== 0) {
    p.log.error("Migration push failed.");
    return false;
  }

  p.log.success("Migrations applied!");
  return true;
}

/**
 * Full Supabase setup flow for quickstart tier.
 * Returns credentials or null if user chose manual setup.
 */
export async function setupSupabase(
  projectDir: string
): Promise<{
  credentials: SupabaseCredentials | null;
  method: "local" | "remote" | "manual";
}> {
  const cliAvailable = hasSupabaseCLI();
  const dockerAvailable = hasDocker();

  if (!cliAvailable) {
    p.log.info(
      chalk.dim(
        "Supabase CLI not found. Install it for automated setup:\n" +
          "  brew install supabase/tap/supabase\n" +
          "  — or —\n" +
          "  npx supabase --version"
      )
    );
    return { credentials: null, method: "manual" };
  }

  // Build options based on what's available
  const options: { value: string; label: string; hint: string }[] = [];

  if (dockerAvailable) {
    options.push({
      value: "local",
      label: "Local development",
      hint: "supabase start — runs Postgres + Auth locally via Docker",
    });
  }

  options.push(
    {
      value: "remote",
      label: "Remote project",
      hint: "Link to an existing Supabase project",
    },
    {
      value: "manual",
      label: "Manual setup",
      hint: "I'll enter the URL and key myself",
    }
  );

  if (!dockerAvailable) {
    p.log.info(
      chalk.dim(
        "Docker not detected — local Supabase requires Docker Desktop."
      )
    );
  }

  const choice = await p.select({
    message: "Supabase setup:",
    options,
  });

  if (p.isCancel(choice)) {
    return { credentials: null, method: "manual" };
  }

  const method = choice as "local" | "remote" | "manual";

  if (method === "manual") {
    return { credentials: null, method: "manual" };
  }

  // Initialize supabase in project
  const inited = supabaseInit(projectDir);
  if (!inited) {
    p.log.error("Failed to initialize Supabase in the project directory.");
    return { credentials: null, method: "manual" };
  }

  if (method === "local") {
    const creds = await supabaseStartLocal(projectDir);
    if (creds) {
      // Apply migrations to local DB
      await supabasePushMigrations(projectDir);
    }
    return { credentials: creds, method: "local" };
  }

  // Remote
  const linked = await supabaseLinkRemote(projectDir);
  if (linked) {
    const pushConfirm = await p.confirm({
      message: "Apply database migrations now?",
      initialValue: true,
    });
    if (!p.isCancel(pushConfirm) && pushConfirm) {
      await supabasePushMigrations(projectDir);
    }
  }

  return { credentials: null, method: "remote" };
}
