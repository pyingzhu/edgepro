"use client";
import { useOnline } from "@/hooks/use-online";
import { Badge } from "@/components/primitives/badge";

export function AirGapPill() {
  const online = useOnline();
  return (
    <Badge tone={online ? "danger" : "success"} aria-live="polite">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: online
            ? "var(--color-danger)"
            : "var(--color-success)",
        }}
      />
      {online ? "Online" : "Air-gapped"}
      <span className="opacity-60 normal-case tracking-normal ml-1 text-2xs">
        {online ? "オンライン" : "エアギャップ"}
      </span>
    </Badge>
  );
}
