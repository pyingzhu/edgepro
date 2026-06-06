import { cn } from "@/lib/utils";

export type Metric = {
  label: { en: string; ja: string };
  base: number;
  tuned: number;
};

export function StatsStrip({ metrics }: { metrics: Metric[] }) {
  if (!metrics?.length) return null;
  const fmt = (n: number) => n.toFixed(2);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      {metrics.map((m) => {
        const delta = m.tuned - m.base;
        const positive = delta >= 0;
        return (
          <div
            key={m.label.en}
            className="rounded-card border border-border bg-surface p-4"
          >
            <p className="text-2xs uppercase tracking-[0.14em] mb-1 text-foreground-muted">
              {m.label.en} · {m.label.ja}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-light text-foreground">
                {fmt(m.tuned)}
              </span>
              <span
                className={cn(
                  "text-xs font-mono",
                  positive ? "text-success" : "text-danger",
                )}
              >
                {positive ? "▲" : "▼"} {fmt(Math.abs(delta))}
              </span>
            </div>
            <p className="text-2xs font-mono mt-1 text-foreground-subtle">
              base {fmt(m.base)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
