import { describe, it, expect } from "vitest";
import { sessionReducer } from "@/lib/session/reducer";
import { initialSessionState } from "@/lib/session/types";

describe("sessionReducer", () => {
  describe("start", () => {
    it("initializes cards for each requested model", () => {
      const next = sessionReducer(initialSessionState, {
        type: "START",
        models: [
          {
            modelId: "edgepro",
            label: { en: "EdgePro", ja: "EdgePro 学習済み" },
          },
        ],
      });
      expect(next.phase).toBe("recording");
      expect(next.cards).toHaveLength(1);
      expect(next.cards[0].modelId).toBe("edgepro");
      expect(next.cards[0].complete).toBe(false);
    });
  });

  describe("transcript", () => {
    it("appends transcript_partial to transcript", () => {
      const a = sessionReducer(initialSessionState, {
        type: "SERVER",
        msg: { type: "transcript_partial", text: "こんに" },
      });
      const b = sessionReducer(a, {
        type: "SERVER",
        msg: { type: "transcript_partial", text: "ちは" },
      });
      expect(b.transcript).toBe("こんにちは");
    });

    it("replaces transcript on transcript_final", () => {
      const a = sessionReducer(initialSessionState, {
        type: "SERVER",
        msg: { type: "transcript_partial", text: "partial" },
      });
      const b = sessionReducer(a, {
        type: "SERVER",
        msg: { type: "transcript_final", text: "final" },
      });
      expect(b.transcript).toBe("final");
    });
  });

  describe("fsoaip events", () => {
    const started = sessionReducer(initialSessionState, {
      type: "START",
      models: [{ modelId: "edgepro", label: { en: "E", ja: "E" } }],
    });

    it("accumulates fsoaip_field valuePartial into the right card+field", () => {
      const a = sessionReducer(started, {
        type: "SERVER",
        msg: {
          type: "fsoaip_field",
          modelId: "edgepro",
          field: "focus",
          valuePartial: "転倒",
        },
      });
      const b = sessionReducer(a, {
        type: "SERVER",
        msg: {
          type: "fsoaip_field",
          modelId: "edgepro",
          field: "focus",
          valuePartial: "リスク",
        },
      });
      expect(b.cards[0].note.focus).toBe("転倒リスク");
    });

    it("ignores fsoaip_field for an unknown modelId", () => {
      const next = sessionReducer(started, {
        type: "SERVER",
        msg: {
          type: "fsoaip_field",
          modelId: "unknown",
          field: "focus",
          valuePartial: "x",
        },
      });
      expect(next.cards[0].note.focus).toBeUndefined();
    });

    it("marks card complete on fsoaip_complete and stores the full note", () => {
      const complete = sessionReducer(started, {
        type: "SERVER",
        msg: {
          type: "fsoaip_complete",
          modelId: "edgepro",
          note: {
            focus: "F",
            subjective: "S",
            objective: "O",
            assessment: "A",
            intervention: "I",
            plan: "P",
          },
        },
      });
      expect(complete.cards[0].complete).toBe(true);
      expect(complete.cards[0].note.focus).toBe("F");
      expect(complete.phase).toBe("recording"); // unchanged by fsoaip_complete
    });
  });

  describe("fact_highlight and error", () => {
    const started = sessionReducer(initialSessionState, {
      type: "START",
      models: [{ modelId: "edgepro", label: { en: "E", ja: "E" } }],
    });

    it("appends a fact_highlight to the matching card", () => {
      const fact = {
        id: "f1",
        text: "fell from bed",
        field: "objective" as const,
        riskWeight: "high" as const,
      };
      const next = sessionReducer(started, {
        type: "SERVER",
        msg: {
          type: "fact_highlight",
          modelId: "edgepro",
          fact,
          matched: true,
        },
      });
      expect(next.cards[0].highRiskMatches).toHaveLength(1);
      expect(next.cards[0].highRiskMatches[0].matched).toBe(true);
    });

    it("enters error phase on server error", () => {
      const next = sessionReducer(started, {
        type: "SERVER",
        msg: { type: "error", message: "boom" },
      });
      expect(next.phase).toBe("error");
      expect(next.errorMessage).toBe("boom");
    });
  });
});
