"use client";

import { motion } from "framer-motion";
import config from "../../tellet.json";

const roleColors: Record<string, string> = {
  customer_support: "bg-green-500/10 text-green-400 border-green-500/20",
  marketing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  sales: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  operations: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  development: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  analytics: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function Agents() {
  return (
    <section className="py-24 px-6 bg-bg-secondary/30">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Meet our AI team
          </h2>
          <p className="mt-3 text-text-secondary">
            Always online. Always ready to help.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {config.agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              className="rounded-xl border border-border bg-bg-primary p-6 transition-all duration-200 hover:border-border-hover"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 text-accent text-sm font-bold flex items-center justify-center">
                  {agent.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{agent.name}</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleColors[agent.role] || "bg-bg-tertiary text-text-secondary border-border"}`}
                  >
                    {agent.role.replace("_", " ")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-text-secondary">Online</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
