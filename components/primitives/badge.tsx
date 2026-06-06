import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-2xs font-medium uppercase tracking-wider",
  {
    variants: {
      tone: {
        neutral: "bg-surface text-foreground-muted border border-border",
        accent: "bg-accent-muted text-accent",
        danger: "bg-danger-muted text-danger",
        success: "bg-success-muted text-success",
        info: "bg-info-muted text-info",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ tone, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
