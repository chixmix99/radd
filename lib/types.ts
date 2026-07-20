import { z } from "zod";

/** Claim lifecycle — the spine of the whole system (see docs/build-plan.md §3). */
export const ClaimStatus = z.enum([
  "draft",
  "coded",
  "scrubbed",
  "submitted",
  "paid",
  "denied",
  "appealing",
  "recovered",
  "lost",
]);
export type ClaimStatus = z.infer<typeof ClaimStatus>;

/** NPHIES denial category prefixes. */
export const DenialCategory = z.enum(["AD", "BE", "CV", "SE", "MN"]);
export type DenialCategory = z.infer<typeof DenialCategory>;

/** Pipeline classification of a denial (drives appeal strategy). */
export const DenialClassification = z.enum([
  "missing_preauth",
  "missing_documentation",
  "coding_mismatch",
  "medical_necessity",
  "benefit_limit",
  "frequency_limit",
  "followup_window",
  "refill_too_soon",
  "coverage_exclusion",
  "duplicate_billing",
  "data_error",
  "other",
]);
export type DenialClassification = z.infer<typeof DenialClassification>;

/** Structured output of the parse step (LLM extraction, Zod-validated). */
export const ParsedDenial = z.object({
  claimReference: z.string().nullable().describe("Claim/reference number from the letter"),
  payer: z.string().nullable(),
  memberId: z.string().nullable(),
  serviceDescription: z.string().nullable(),
  serviceDate: z.string().nullable(),
  amountSar: z.number().nullable(),
  denialCode: z.string().nullable().describe("NPHIES adjudication code, e.g. BE-1-4"),
  denialReasonText: z.string().describe("Denial reason as stated, verbatim or summarized"),
  letterLanguage: z.enum(["en", "ar", "mixed"]),
  appealDeadlineDays: z.number().nullable(),
});
export type ParsedDenial = z.infer<typeof ParsedDenial>;

/** Output of the classify step. */
export const ClassifiedDenial = z.object({
  classification: DenialClassification,
  category: DenialCategory.nullable(),
  appealable: z.boolean(),
  strategy: z.string().describe("One-paragraph appeal strategy"),
  requiredEvidence: z.array(z.string()).describe("Documents the clinic must attach"),
});
export type ClassifiedDenial = z.infer<typeof ClassifiedDenial>;

/** Output of the generate step. */
export const AppealLetter = z.object({
  language: z.enum(["en", "ar"]),
  subject: z.string(),
  body: z.string().describe("Full appeal letter body, ready to review and send"),
  attachmentChecklist: z.array(z.string()),
  confidenceNote: z.string().describe("Honest note on appeal strength for the human reviewer"),
});
export type AppealLetter = z.infer<typeof AppealLetter>;

/** Full pipeline result. */
export const AppealResult = z.object({
  parsed: ParsedDenial,
  classified: ClassifiedDenial,
  letters: z.array(AppealLetter).describe("EN and/or AR versions"),
});
export type AppealResult = z.infer<typeof AppealResult>;

/** A record from data/nphies/synthetic_denials.json (also future real uploads). */
export const DenialRecord = z.object({
  id: z.string(),
  payer: z.string(),
  claim_type: z.string(),
  service: z.string(),
  icd10: z.array(z.string()),
  amount_sar: z.number(),
  denial_code: z.string(),
  denial_reason_en: z.string(),
  language: z.string(),
  denial_letter_text: z.string(),
  ground_truth: z
    .object({
      classification: z.string(),
      appealable: z.boolean(),
      appeal_angle: z.string(),
    })
    .optional(),
});
export type DenialRecord = z.infer<typeof DenialRecord>;
