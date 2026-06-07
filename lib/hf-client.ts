// ---------------------------------------------------------------------------
// HuggingFace Space inference client.
//
// The deployed Space (https://schang-jp-edgepro-care-notes.hf.space) exposes:
//   GET  /health → { ok, cuda, model_loaded }
//   POST /infer  → multipart form-data with field "file" (audio/wav)
//                  returns JSON: { focus, subjective, objective, assessment,
//                                  intervention, plan, transcript? }
//
// This module is OPT-IN — only used when NEXT_PUBLIC_HF_INFERENCE_URL is set.
// Removing the env var instantly reverts to the WebSocket flow.
// ---------------------------------------------------------------------------

import type { FsoaipNote } from "@/lib/fsoaip/types";

/** Shape returned by the HF Space /infer endpoint. All fields optional to be lenient. */
export type HfInferResponse = Partial<FsoaipNote> & {
  transcript?: string;
};

/** Assemble Int16 PCM frames into a single 16-bit mono WAV blob. */
export function pcmFramesToWavBlob(
  frames: Int16Array[],
  sampleRate = 16000,
): Blob {
  const totalSamples = frames.reduce((sum, f) => sum + f.length, 0);
  const pcm = new Int16Array(totalSamples);
  let offset = 0;
  for (const f of frames) {
    pcm.set(f, offset);
    offset += f.length;
  }

  const dataSize = pcm.length * 2; // Int16 = 2 bytes
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (pos: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(pos + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  // fmt sub-chunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // sub-chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  // data sub-chunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // little-endian PCM samples
  let pos = 44;
  for (let i = 0; i < pcm.length; i++) {
    view.setInt16(pos, pcm[i], true);
    pos += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/** POST the WAV blob to the HF Space's /infer endpoint. Throws on non-2xx. */
export async function inferViaHf(
  baseUrl: string,
  wavBlob: Blob,
  signal?: AbortSignal,
): Promise<HfInferResponse> {
  const url = `${baseUrl.replace(/\/$/, "")}/infer`;
  const formData = new FormData();
  formData.append("file", wavBlob, "handoff.wav");

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`HF /infer ${response.status}: ${text.slice(0, 200)}`);
  }

  return response.json();
}

/** Lift an HF response (possibly partial) into a fully-populated FsoaipNote. */
export function hfResponseToNote(r: HfInferResponse): FsoaipNote {
  return {
    focus: r.focus ?? "",
    subjective: r.subjective ?? "",
    objective: r.objective ?? "",
    assessment: r.assessment ?? "",
    intervention: r.intervention ?? "",
    plan: r.plan ?? "",
  };
}
