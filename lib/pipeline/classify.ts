import { ClassifiedDenial, ParsedDenial } from "@/lib/types";
import { lookupDenialCode, strategyForCategory, categoryDescription } from "@/lib/denial-codes";
import { structuredCompletion } from "@/lib/llm";

const SYSTEM = `You are a Saudi medical claims appeals specialist. Classify a denial and produce an appeal strategy.

Classifications: missing_preauth, missing_documentation, coding_mismatch, medical_necessity, benefit_limit, frequency_limit, followup_window, refill_too_soon, coverage_exclusion, duplicate_billing, data_error, other.

Schema:
{
  "classification": <one of the above>,
  "category": "AD" | "BE" | "CV" | "SE" | "MN" | null,
  "appealable": boolean,
  "strategy": string,
  "requiredEvidence": string[]
}

Guidance: SE (missing documentation) denials have the highest appeal win rate — strategy is attach + resubmit. data_error and duplicate_billing are usually corrections, not appeals (appealable: false). medical_necessity needs clinical guideline citations. Be specific to the actual service and denial, not generic.`;

/** Step 2 — Classify: official code lookup first (deterministic), LLM for strategy. */
export async function classifyDenial(parsed: ParsedDenial): Promise<ClassifiedDenial> {
  const official = lookupDenialCode(parsed.denialCode);

  const context = official
    ? `Official NPHIES code ${official.code} (category ${official.category}: ${categoryDescription(official.category)}).
Meaning (EN): ${official.en}
Meaning (AR): ${official.ar}
Category-level appeal strategy: ${strategyForCategory(official.category)}`
    : `No official NPHIES code identified — classify from the reason text alone.`;

  const result = await structuredCompletion(
    ClassifiedDenial,
    SYSTEM,
    `Denial details:
Payer: ${parsed.payer ?? "[unknown]"}
Service: ${parsed.serviceDescription ?? "[unknown]"}
Amount: ${parsed.amountSar ?? "[unknown]"} SAR
Denial code: ${parsed.denialCode ?? "[none stated]"}
Stated reason: ${parsed.denialReasonText}

${context}`,
  );

  // Deterministic override: trust the official taxonomy for category.
  if (official) result.category = official.category;
  return result;
}
