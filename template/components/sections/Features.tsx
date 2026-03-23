"use client";

import { motion } from "framer-motion";
import { SiteIcon } from "./Icons";
import config from "../../tellet.json";

export function Features() {
  const features = config.site.features as { title: string; description: string; icon: string }[];
  if (!features || features.length === 0) return null;

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Why choose us
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group rounded-xl border border-border bg-bg-secondary/40 p-6 transition-all duration-200 hover:border-border-hover hover:-translate-y-0.5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
            >
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 text-accent mb-4">
                <SiteIcon name={feature.icon} />
              </div>
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
