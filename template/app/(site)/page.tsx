import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { Agents } from "@/components/sections/Agents";
import { FAQ } from "@/components/sections/FAQ";
import { CTA } from "@/components/sections/CTA";
import { Footer } from "@/components/sections/Footer";
import { ChatWidget } from "@/components/chat/ChatWidget";
import config from "../../tellet.json";

export default function HomePage() {
  const csAgent =
    config.agents.find((a) => a.role === "customer_support") || config.agents[0];

  return (
    <>
      <Hero />
      <Features />
      <Agents />
      <FAQ />
      <CTA />
      <Footer />
      <ChatWidget agentId={csAgent.id} agentName={csAgent.name} />
    </>
  );
}
