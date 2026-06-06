import type { ServerMsg } from "@/lib/ws/protocol";
import type { ModelOutput, SessionState } from "./types";

export type SessionAction =
  | {
      type: "START";
      models: { modelId: string; label: { en: string; ja: string } }[];
    }
  | { type: "STOP" }
  | { type: "SERVER"; msg: ServerMsg }
  | { type: "RESET" };

export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case "START": {
      const cards: ModelOutput[] = action.models.map((m) => ({
        modelId: m.modelId,
        label: m.label,
        note: {},
        highRiskMatches: [],
        complete: false,
      }));
      return { ...state, phase: "recording", transcript: "", cards };
    }
    case "STOP":
      return { ...state, phase: "streaming" };
    case "RESET":
      return { phase: "idle", transcript: "", cards: [] };
    case "SERVER": {
      const m = action.msg;
      switch (m.type) {
        case "transcript_partial":
          return { ...state, transcript: state.transcript + m.text };
        case "transcript_final":
          return { ...state, transcript: m.text };
        case "fsoaip_field": {
          const cards = state.cards.map((c) =>
            c.modelId === m.modelId
              ? {
                  ...c,
                  note: {
                    ...c.note,
                    [m.field]: (c.note[m.field] ?? "") + m.valuePartial,
                  },
                }
              : c,
          );
          return { ...state, cards };
        }
        case "fsoaip_complete": {
          const cards = state.cards.map((c) =>
            c.modelId === m.modelId
              ? { ...c, note: m.note, complete: true }
              : c,
          );
          return { ...state, cards };
        }
        case "fact_highlight": {
          const cards = state.cards.map((c) =>
            c.modelId === m.modelId
              ? {
                  ...c,
                  highRiskMatches: [
                    ...c.highRiskMatches,
                    { fact: m.fact, matched: m.matched },
                  ],
                }
              : c,
          );
          return { ...state, cards };
        }
        case "error":
          return { ...state, phase: "error", errorMessage: m.message };
        default:
          return state;
      }
    }
    default:
      return state;
  }
}
