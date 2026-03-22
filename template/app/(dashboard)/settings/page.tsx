import config from "../../../tellet.json";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="rounded-xl border border-border bg-bg-secondary/50 p-6 space-y-3">
        <h2 className="text-lg font-semibold">Company</h2>
        <div className="grid gap-2">
          <div><span className="text-sm text-text-secondary">Name:</span> <span className="text-sm font-medium ml-2">{config.company.name}</span></div>
          <div><span className="text-sm text-text-secondary">Industry:</span> <span className="text-sm font-medium ml-2">{config.company.industry}</span></div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-secondary/50 p-6 space-y-3">
        <h2 className="text-lg font-semibold">Infrastructure</h2>
        <div className="grid gap-2">
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div><p className="text-sm font-medium">Engine</p><p className="text-xs text-text-tertiary">{config.engine}</p></div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div><p className="text-sm font-medium">LLM Provider</p><p className="text-xs text-text-tertiary">{config.llm.provider} / {config.llm.defaultModel}</p></div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div><p className="text-sm font-medium">Storage</p><p className="text-xs text-text-tertiary">{config.storage}</p></div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-bg-secondary/50 p-6 space-y-3">
        <h2 className="text-lg font-semibold">Channels</h2>
        <div className="grid gap-2">
          {Object.entries(config.channels).map(([name, ch]) => (
            <div key={name} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <span className="text-sm font-medium capitalize">{name.replace("_", " ")}</span>
              <span className={`text-xs ${ch.enabled ? "text-green-400" : "text-text-tertiary"}`}>
                {ch.enabled ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
