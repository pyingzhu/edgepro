import type { ModelOutput } from "@/lib/session/types";
import type { FsoaipField } from "@/lib/fsoaip/types";
import { Card } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { FieldRow } from "./field-row";
import { HighRiskChip } from "./high-risk-chip";

const FIELD_ORDER: FsoaipField[] = [
  "focus",
  "subjective",
  "objective",
  "assessment",
  "intervention",
  "plan",
];

export function FsoaipCard({ output }: { output: ModelOutput }) {
  const variant = output.highlighted ? "highlighted" : "default";
  return (
    <Card variant={variant} className="flex flex-col gap-0 animate-fade-up">
      <header className="flex items-start justify-between mb-3 pb-3 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {output.label.en}
          </h3>
          <p className="text-xs text-foreground-muted">{output.label.ja}</p>
        </div>
        <Badge tone={output.complete ? "success" : "accent"}>
          {output.complete ? "complete" : "streaming"}
        </Badge>
      </header>

      {output.highRiskMatches.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {output.highRiskMatches
            .filter((m) => m.matched)
            .map((m) => (
              <HighRiskChip key={m.fact.id} fact={m.fact} />
            ))}
        </div>
      )}

      <div>
        {FIELD_ORDER.map((f) => (
          <FieldRow
            key={f}
            field={f}
            value={output.note[f]}
            streaming={!output.complete && Boolean(output.note[f])}
          />
        ))}
      </div>
    </Card>
  );
}
