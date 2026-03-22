import { createServerSupabase } from "@/lib/supabase";

export default async function AgentsPage() {
  const supabase = await createServerSupabase();
  const { data: agents } = await supabase.from("agents").select("*").order("created_at");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
      <div className="grid gap-4">
        {agents?.map((agent) => (
          <div key={agent.id} className="rounded-xl border border-border bg-bg-secondary/50 p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-accent/10 text-accent text-sm font-bold flex items-center justify-center">
                {agent.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{agent.name}</p>
                <p className="text-sm text-text-secondary capitalize">{agent.role.replace("_", " ")} &middot; {agent.model}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${agent.status === "active" ? "bg-green-400" : "bg-text-tertiary"}`} />
                <span className="text-xs text-text-secondary capitalize">{agent.status}</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-bg-primary border border-border p-3">
              <p className="text-xs text-text-tertiary uppercase tracking-wider mb-1">System Prompt</p>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{agent.system_prompt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
