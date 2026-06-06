import type { FsoaipField } from "@/lib/fsoaip/types";

const FIELD_LABELS: Record<FsoaipField, { en: string; ja: string }> = {
  focus: { en: "Focus", ja: "フォーカス" },
  subjective: { en: "Subjective", ja: "主観 S" },
  objective: { en: "Objective", ja: "客観 O" },
  assessment: { en: "Assessment", ja: "評価 A" },
  intervention: { en: "Intervention", ja: "実施 I" },
  plan: { en: "Plan", ja: "計画 P" },
};

export function FieldRow({
  field,
  value,
  streaming,
}: {
  field: FsoaipField;
  value: string | undefined;
  streaming?: boolean;
}) {
  const label = FIELD_LABELS[field];
  return (
    <div className="py-4 border-b border-border-subtle last:border-b-0">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-sm uppercase tracking-[0.16em] font-medium text-foreground-muted">
          {label.en}
        </span>
        <span className="text-base text-foreground-subtle">{label.ja}</span>
      </div>
      <div className="text-lg leading-relaxed min-h-[1.75rem] text-foreground">
        {value || <span className="text-foreground-subtle">—</span>}
        {streaming && value && (
          <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-energy animate-pulse-glow" />
        )}
      </div>
    </div>
  );
}
