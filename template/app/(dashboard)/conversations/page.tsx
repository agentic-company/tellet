import { createServerSupabase } from "@/lib/supabase";

export default async function ConversationsPage() {
  const supabase = await createServerSupabase();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("*, agents(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
      {conversations && conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((c) => (
            <div key={c.id} className="flex items-center gap-4 rounded-xl border border-border bg-bg-secondary/50 p-4">
              <div className="flex-1">
                <span className="font-medium text-sm">{(c.agents as { name: string })?.name}</span>
                <span className="text-xs text-text-tertiary ml-2">via {c.channel}</span>
              </div>
              <span className="text-xs text-text-tertiary">{new Date(c.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-bg-secondary/20 p-8 text-center">
          <p className="text-text-secondary text-sm">No conversations yet.</p>
        </div>
      )}
    </div>
  );
}
