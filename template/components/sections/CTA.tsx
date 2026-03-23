"use client";

import { motion } from "framer-motion";
import config from "../../tellet.json";

export function CTA() {
  return (
    <section className="py-24 px-6">
      <motion.div
        className="max-w-3xl mx-auto text-center rounded-2xl border border-border bg-bg-secondary/50 p-12 md:p-16 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,92,246,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="relative">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {config.site.cta || "Ready to get started?"}
          </h2>
          <p className="text-text-secondary mb-8 max-w-lg mx-auto">
            Our AI team is available 24/7 to help you. Start a conversation now.
          </p>
          <button
            onClick={() => {
              const el = document.getElementById("chat-trigger");
              el?.click();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 text-sm font-medium text-white hover:bg-accent-hover transition-all shadow-[0_0_30px_var(--color-accent-glow)] cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
            </svg>
            Chat with us
          </button>
        </div>
      </motion.div>
    </section>
  );
}
