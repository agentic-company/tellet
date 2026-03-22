import { createServerSupabase } from "@/lib/supabase";
import config from "../../../tellet.json";

const roleColors: Record<string, string> = {
  customer_support: "bg-green-500/10 text-green-400 border-green-500/20",
  marketing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  sales: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  operations: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  development: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  analytics: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: agents } = await supabase.from("agents").select("*").order("created_at");
  const { data: activity } = await supabase
    .from("activity_log")
    .select("*, agents(name, role)")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{config.company.name}</h1>
        <p className="text-text-secondary text-sm mt-1">Your AI team is ready.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents?.map((agent) => (
          <a key={agent.id} href={`/agents?id=${agent.id}`}
            className="rounded-xl border border-border bg-bg-secondary/50 p-5 hover:border-border-hover transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold">{agent.name}</span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${roleColors[agent.role] || "bg-bg-tertiary text-text-secondary border-border"}`}>
                {agent.role.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${agent.status === "active" ? "bg-green-400" : "bg-text-tertiary"}`} />
              <span className="text-xs text-text-secondary capitalize">{agent.status}</span>
            </div>
          </a>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {activity && activity.length > 0 ? (
          <div className="space-y-2">
            {activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border border-border bg-bg-secondary/30 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{(a.agents as { name: string })?.name}</span>{" "}
                    <span className="text-text-secondary">{a.summary || a.action}</span>
                  </p>
                  <p className="text-xs text-text-tertiary mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-bg-secondary/20 p-8 text-center">
            <p className="text-text-secondary text-sm">No activity yet. Chat with your agents to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
