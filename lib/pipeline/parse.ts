import { ParsedDenial } from "@/lib/types";
import { structuredCompletion } from "@/lib/llm";

const SYSTEM = `You are a claims analyst for Saudi healthcare providers. You extract structured data from insurance claim denial letters. Letters may be in English, Arabic, or mixed. NPHIES denial codes look like XX-N-N (e.g. BE-1-4, CV-3-2, SE-1-6, MN-1-1, AD-2-5).

Schema:
{
  "claimReference": string | null,
  "payer": string | null,
  "memberId": string | null,
  "serviceDescription": string | null,
  "serviceDate": string | null,
  "amountSar": number | null,
  "denialCode": string | null,
  "denialReasonText": string,
  "letterLanguage": "en" | "ar" | "mixed",
  "appealDeadlineDays": number | null
}

Rules: extract only what is present — use null for missing fields, never invent values. denialReasonText must reflect the stated reason. If multiple line items are denied, focus on the denied one(s).`;

/** Step 1 — Parse: denial letter free text → structured fields. */
export async function parseDenial(letterText: string): Promise<ParsedDenial> {
  return structuredCompletion(ParsedDenial, SYSTEM, `Denial letter:\n\n${letterText}`);
}
