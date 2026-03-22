import { ChatWidget } from "@/components/chat/ChatWidget";
import config from "../../tellet.json";

export default function HomePage() {
  const csAgent = config.agents.find((a) => a.role === "customer_support") || config.agents[0];

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            {config.company.name}
          </h1>
          <p className="mt-4 text-lg text-text-secondary max-w-lg mx-auto">
            {config.company.description}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <a href="/dashboard" className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-hover transition-colors">
              Dashboard
            </a>
          </div>
          <p className="mt-12 text-xs text-text-tertiary">
            Powered by <span className="text-text-secondary">tellet</span> — AI Agentic Company
          </p>
        </div>
      </div>
      <ChatWidget agentId={csAgent.id} agentName={csAgent.name} />
    </>
  );
}
