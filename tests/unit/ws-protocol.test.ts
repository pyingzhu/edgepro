import { describe, it, expect } from "vitest";
import { parseServerMsg } from "@/lib/ws/protocol";

describe("parseServerMsg", () => {
  it("parses transcript_partial", () => {
    const ok = parseServerMsg({
      type: "transcript_partial",
      text: "こんにちは",
    });
    expect(ok.type).toBe("transcript_partial");
  });

  it("parses fsoaip_field", () => {
    const ok = parseServerMsg({
      type: "fsoaip_field",
      modelId: "edgepro",
      field: "focus",
      valuePartial: "転倒",
    });
    expect(ok.type).toBe("fsoaip_field");
  });

  it("rejects an unknown type", () => {
    expect(() => parseServerMsg({ type: "garbage" })).toThrow();
  });

  it("rejects bad field enum", () => {
    expect(() =>
      parseServerMsg({
        type: "fsoaip_field",
        modelId: "x",
        field: "not-a-field",
        valuePartial: "a",
      }),
    ).toThrow();
  });
});
