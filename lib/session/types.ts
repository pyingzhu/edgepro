import type { FsoaipNote, FactItem } from "@/lib/fsoaip/types";

export type ModelOutput = {
  modelId: string;
  label: { en: string; ja: string };
  note: Partial<FsoaipNote>;
  highRiskMatches: { fact: FactItem; matched: boolean }[];
  complete: boolean;
  highlighted?: boolean;
};

export type SessionState = {
  phase: "idle" | "recording" | "streaming" | "done" | "error";
  transcript: string;
  cards: ModelOutput[];
  errorMessage?: string;
};

export const initialSessionState: SessionState = {
  phase: "idle",
  transcript: "",
  cards: [],
};
