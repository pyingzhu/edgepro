// ---------------------------------------------------------------------------
// Mirrored from apps/rensei/lib/fsoaip/types.ts
//   branch: schang/fur-166-fsoaip-demo
//   sha:    efcd0638d696effd7122c5290a07cf921818c9b5
//   date:   2026-06-06
// Do NOT edit here without updating the source in rensei and re-pulling.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// F-SOAIP data contract (FUR-166 / FUR-171 hand-off).
//
// Shared types for the JA介護 voice → F-SOAIP gold-correction task. The
// generator (FUR-171) produces target content matching FsoaipTargetContent;
// Rensei imports these types to render the LEFT annotator panel (audio +
// transcript + fact checklist + candidate note) and to type-check the seed.
//
// F-SOAIP = Focus, Subjective, Objective, Assessment, Intervention, Plan —
// the 6-section nursing/care record format used in Japanese 介護・看護 docs.
//
// Dependency-free: pure type module, no runtime imports.
// ---------------------------------------------------------------------------

/** The 6 F-SOAIP sections as a structured note. */
export type FsoaipNote = {
  focus: string;
  subjective: string;
  objective: string;
  assessment: string;
  intervention: string;
  plan: string;
};

/** The 6 F-SOAIP section keys (the keys of FsoaipNote). */
export type FsoaipField =
  | "focus"
  | "subjective"
  | "objective"
  | "assessment"
  | "intervention"
  | "plan";

/**
 * One key fact a faithful note must capture, drawn from the source transcript.
 * `field` is where the fact belongs in F-SOAIP; `riskWeight` drives the
 * "missing high-risk fact" check.
 */
export type FactItem = {
  id: string;
  text: string;
  field: FsoaipField;
  riskWeight: "high" | "medium" | "low";
};

/** The kinds of error the generator can plant in (or detect in) a candidate. */
export type ErrorType =
  | "OMITTED"
  | "FABRICATED"
  | "WRONG_FIELD"
  | "WRONG_TERM"
  | "WRONG_VITAL"
  | "WRONG_VALUE";

/**
 * A single known defect in the candidate note — the eval key. NEVER surfaced
 * to the annotator; used to score the human correction and downstream judges.
 */
export type ErrorCard = {
  id: string;
  errorType: ErrorType;
  field: FsoaipField;
  /** Links the error to a FactItem when it concerns a specific checklist fact. */
  factId?: string;
  severity: "high" | "medium" | "low";
  detail: string;
};

/**
 * The annotator-facing content blob stored on a voice-medical target. The LEFT
 * panel renders audio_url + transcript + fact_checklist + candidate_fsoaip.
 *
 * NOTE: error_cards (the eval key) are deliberately NOT part of this type.
 * getTaskById ships target.content (and raw metadata) wholesale to the client,
 * so anything here is visible to the annotator. Error cards live server-side in
 * judge_results.rawResponse instead, loaded only by the (future)
 * error_card_verification task — never by gold-correction.
 */
export type FsoaipTargetContent = {
  audio_url: string;
  transcript: string;
  candidate_fsoaip: FsoaipNote;
  fact_checklist: FactItem[];
};
