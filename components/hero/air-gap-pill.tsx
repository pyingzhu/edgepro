"use client";
import { useOnline } from "@/hooks/use-online";
import { Badge } from "@/components/primitives/badge";

export function AirGapPill() {
  const online = useOnline();

  if (online === null) {
    // SSR + first client render: stable neutral state, no hydration mismatch
    return (
      <Badge tone="neutral" aria-live="polite">
        <span className="inline-block w-2 h-2 rounded-full bg-foreground-subtle" />
        Checking…
      </Badge>
    );
  }

  return (
    <Badge tone={online ? "danger" : "success"} aria-live="polite">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{
          backgroundColor: online
            ? "var(--color-danger)"
            : "var(--color-success)",
        }}
      />
      {online ? "Online" : "Air-gapped"}
      <span className="opacity-70 normal-case tracking-normal ml-1.5 text-xs">
        {online ? "オンライン" : "エアギャップ"}
      </span>
    </Badge>
  );
}
