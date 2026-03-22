import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover shadow-[0_0_20px_var(--color-accent-glow)]",
  secondary: "bg-bg-secondary text-text-primary border border-border hover:border-border-hover",
  ghost: "text-text-secondary hover:text-text-primary",
};

export function Button({
  variant = "primary",
  href,
  className,
  children,
  ...props
}: { variant?: Variant; href?: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = cn(
    "inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition-all duration-200 cursor-pointer",
    variants[variant],
    className
  );
  if (href) return <a href={href} className={classes}>{children}</a>;
  return <button className={classes} {...props}>{children}</button>;
}
