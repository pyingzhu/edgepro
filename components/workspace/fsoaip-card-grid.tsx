import type { ModelOutput } from "@/lib/session/types";
import { FsoaipCard } from "./fsoaip-card";

export function FsoaipCardGrid({ cards }: { cards: ModelOutput[] }) {
  if (cards.length === 0) return null;
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))`,
      }}
    >
      {cards.map((c) => (
        <FsoaipCard key={c.modelId} output={c} />
      ))}
    </div>
  );
}
