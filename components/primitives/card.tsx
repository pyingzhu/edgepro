import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "highlighted" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-card bg-surface p-8 shadow-card",
        variant === "default" && "border border-border",
        variant === "highlighted" && "border border-accent shadow-glow-accent",
        variant === "muted" && "border border-border-subtle opacity-85",
        className,
      )}
      {...props}
    />
  );
}
