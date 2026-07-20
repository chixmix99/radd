import { AppealLetter, ClassifiedDenial, ParsedDenial } from "@/lib/types";
import { structuredCompletion } from "@/lib/llm";

const SYSTEM = `You write professional insurance claim appeal letters for Saudi healthcare providers, addressed to the payer's claims/appeals department.

Schema:
{
  "language": "en" | "ar",
  "subject": string,
  "body": string,
  "attachmentChecklist": string[],
  "confidenceNote": string
}

Letter structure: reference line (claim ref, member, service date) → factual summary → the payer's stated denial reason → the provider's argument (policy/CHI rules and clinical justification) → specific request (reprocess and pay) → closing with response deadline per CHI dispute rules.

Rules:
- Formal, factual, non-emotional. No exaggeration, no invented clinical facts — where clinic input is needed, insert bracketed placeholders like [ATTACH: ultrasound report dated ...] or [CONFIRM: physician name].
- Arabic letters: formal Modern Standard Arabic, correct medical/insurance terminology.
- confidenceNote: honest assessment for the human reviewer — strength of the appeal and what would strengthen it.`;

/** Step 3 — Generate: classified denial → appeal letter in the requested language. */
export async function generateAppeal(
  parsed: ParsedDenial,
  classified: ClassifiedDenial,
  language: "en" | "ar",
): Promise<AppealLetter> {
  return structuredCompletion(
    AppealLetter,
    SYSTEM,
    `Write the appeal letter in ${language === "ar" ? "Arabic" : "English"}.

Claim facts:
Claim reference: ${parsed.claimReference ?? "[CONFIRM: claim reference]"}
Payer: ${parsed.payer ?? "[CONFIRM: payer]"}
Member ID: ${parsed.memberId ?? "[CONFIRM: member ID]"}
Service: ${parsed.serviceDescription ?? "[CONFIRM: service]"}
Service date: ${parsed.serviceDate ?? "[CONFIRM: service date]"}
Amount: ${parsed.amountSar ?? "[CONFIRM: amount]"} SAR
Denial code: ${parsed.denialCode ?? "not stated"}
Denial reason: ${parsed.denialReasonText}

Appeal strategy: ${classified.strategy}
Required evidence to reference: ${classified.requiredEvidence.join("; ") || "none identified"}`,
  );
}
