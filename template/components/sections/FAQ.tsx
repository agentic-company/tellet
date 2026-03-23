"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import config from "../../tellet.json";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
      >
        <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors pr-4">
          {question}
        </span>
        <svg
          className={`w-4 h-4 text-text-tertiary flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm text-text-secondary leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQ() {
  const faq = config.site.faq as { question: string; answer: string }[];
  if (!faq || faq.length === 0) return null;

  return (
    <section className="py-24 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          className="border-t border-border"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {faq.map((item) => (
            <FAQItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
