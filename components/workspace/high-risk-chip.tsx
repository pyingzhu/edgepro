import type { FactItem } from "@/lib/fsoaip/types";
import { Badge } from "@/components/primitives/badge";

const RISK_GLYPHS: Record<string, string> = {
  fall: "⚠ FALL",
  fever: "⚠ FEVER",
  vital: "⚠ VITAL",
};

function detectGlyph(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("fall") || text.includes("転倒")) return RISK_GLYPHS.fall;
  if (lower.includes("fever") || text.includes("発熱"))
    return RISK_GLYPHS.fever;
  return RISK_GLYPHS.vital;
}

export function HighRiskChip({ fact }: { fact: FactItem }) {
  return (
    <Badge
      tone={fact.riskWeight === "high" ? "danger" : "neutral"}
      className="animate-fade-up"
    >
      {detectGlyph(fact.text)}
    </Badge>
  );
}
