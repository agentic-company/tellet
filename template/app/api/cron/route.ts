import { runAllScheduledAgents, runScheduledAgent } from "@/lib/scheduler";

export async function GET(request: Request) {
  // Verify cron secret (optional, for security)
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run specific agent or all scheduled agents
  const agentId = url.searchParams.get("agent");

  try {
    if (agentId) {
      const task = url.searchParams.get("task") || undefined;
      const result = await runScheduledAgent(agentId, task);
      return Response.json(result);
    }

    const results = await runAllScheduledAgents();
    return Response.json({ results, count: results.length });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 }
    );
  }
}
