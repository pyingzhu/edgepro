import { z } from "zod";
import type { FsoaipNote, FsoaipField, FactItem } from "@/lib/fsoaip/types";

const FsoaipFieldSchema = z.enum([
  "focus",
  "subjective",
  "objective",
  "assessment",
  "intervention",
  "plan",
]) satisfies z.ZodType<FsoaipField>;

const FsoaipNoteSchema = z
  .object({
    focus: z.string(),
    subjective: z.string(),
    objective: z.string(),
    assessment: z.string(),
    intervention: z.string(),
    plan: z.string(),
  })
  .strict() satisfies z.ZodType<FsoaipNote>;

const FactItemSchema = z
  .object({
    id: z.string(),
    text: z.string(),
    field: FsoaipFieldSchema,
    riskWeight: z.enum(["high", "medium", "low"]),
  })
  .strict() satisfies z.ZodType<FactItem>;

// ── Server → Client ─────────────────────────────────────────────

export const ServerMsgSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("transcript_partial"), text: z.string() }),
  z.object({ type: z.literal("transcript_final"), text: z.string() }),
  z.object({
    type: z.literal("fsoaip_field"),
    modelId: z.string(),
    field: FsoaipFieldSchema,
    valuePartial: z.string(),
  }),
  z.object({
    type: z.literal("fsoaip_complete"),
    modelId: z.string(),
    note: FsoaipNoteSchema,
  }),
  z.object({
    type: z.literal("fact_highlight"),
    modelId: z.string(),
    fact: FactItemSchema,
    matched: z.boolean(),
  }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export type ServerMsg = z.infer<typeof ServerMsgSchema>;

export function parseServerMsg(raw: unknown): ServerMsg {
  return ServerMsgSchema.parse(raw);
}

// ── Client → Server ─────────────────────────────────────────────

export type ClientMsg =
  | { type: "start"; sampleRate: 16000; models: string[] }
  | { type: "audio"; pcm: ArrayBuffer }
  | { type: "stop" };

export function encodeClientMsg(msg: ClientMsg): string | ArrayBuffer {
  if (msg.type === "audio") return msg.pcm;
  return JSON.stringify(msg);
}
