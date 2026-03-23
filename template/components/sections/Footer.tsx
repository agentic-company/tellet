import config from "../../tellet.json";

export function Footer() {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{config.company.name}</span>
          <span className="text-xs text-text-tertiary">&middot;</span>
          <span className="text-xs text-text-tertiary">
            Powered by <span className="text-text-secondary">tellet</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-text-tertiary">
          <a href="/dashboard" className="hover:text-text-secondary transition-colors">
            Dashboard
          </a>
        </div>
      </div>
    </footer>
  );
}
