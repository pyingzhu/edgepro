import type { ModelOutput } from "@/lib/session/types";
import type { FsoaipField } from "@/lib/fsoaip/types";
import { Card } from "@/components/primitives/card";
import { Badge } from "@/components/primitives/badge";
import { FieldRow } from "./field-row";

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
      <header className="flex items-start justify-between mb-4 pb-4 border-b border-border">
        <div>
          <h3 className="text-2xl font-semibold text-foreground">
            {output.label.en}
          </h3>
          <p className="text-lg text-foreground-muted">{output.label.ja}</p>
        </div>
        <Badge tone={output.complete ? "success" : "accent"}>
          {output.complete ? "complete" : "streaming"}
        </Badge>
      </header>

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
