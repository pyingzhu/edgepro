// ---------------------------------------------------------------------------
// F-SOAIP data contract.
//
// F-SOAIP = Focus, Subjective, Objective, Assessment, Intervention, Plan —
// the 6-section nursing/care record format used in Japanese 介護・看護 docs.
//
// Shared types for the JA 介護 voice → F-SOAIP structured-note task. One
// audio clip yields one FsoaipNote (the 6 sections), accompanied by a
// fact_checklist that drives high-risk highlighting on the rendered card.
// The error-card taxonomy lives server-side for the eval pipeline only —
// it is deliberately excluded from FsoaipTargetContent so it never reaches
// the annotator/demo client.
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
