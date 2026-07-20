import { z } from "zod";

/**
 * Provider-agnostic LLM client.
 *
 * DEPLOYMENT REALITY (KSA): production must run against a locally hosted model
 * (PDPL data-residency rules for health data — see docs/build-plan.md §6).
 * Any OpenAI-compatible endpoint works: vLLM, Ollama, LM Studio, TGI —
 * serving ALLaM, Jais, Qwen, Llama, etc. on in-Kingdom infrastructure.
 *
 * Dev/demo with SYNTHETIC data may use a hosted API (no personal data involved).
 *
 * Config (env — no hardcoding, repo convention):
 *   RADD_LLM_BASE_URL  e.g. http://localhost:11434/v1 (Ollama) or a vLLM endpoint
 *   RADD_LLM_API_KEY   key if the endpoint needs one ("ollama" works for Ollama)
 *   RADD_MODEL         model name at that endpoint, e.g. "qwen2.5:14b", "jais-13b"
 *   RADD_MAX_TOKENS    default 2048
 */
const BASE_URL = process.env.RADD_LLM_BASE_URL ?? "http://localhost:11434/v1";
const API_KEY = process.env.RADD_LLM_API_KEY ?? "ollama";
const MODEL = process.env.RADD_MODEL ?? "qwen2.5:14b";
const MAX_TOKENS = Number(process.env.RADD_MAX_TOKENS ?? 2048);

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      messages,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM endpoint error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("LLM returned no content");
  return text;
}

/**
 * Call the LLM and parse its response against a Zod schema.
 * Retries once with the validation error fed back — the Signal Hire pattern.
 */
export async function structuredCompletion<T>(
  schema: z.ZodType<T>,
  system: string,
  user: string,
): Promise<T> {
  const sys = `${system}\n\nRespond with ONLY a valid JSON object matching the required schema. No markdown fences, no commentary.`;

  const attempt = (extra?: string) =>
    chatCompletion([
      { role: "system", content: sys },
      { role: "user", content: extra ? `${user}\n\n${extra}` : user },
    ]);

  const tryParse = (raw: string): T => {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    return schema.parse(JSON.parse(cleaned));
  };

  const first = await attempt();
  try {
    return tryParse(first);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    const second = await attempt(
      `Your previous response failed validation:\n${detail}\n\nPrevious response:\n${first}\n\nReturn corrected JSON only.`,
    );
    return tryParse(second);
  }
}
