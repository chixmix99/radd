# NPHIES Starter Dataset — Claims Copilot v1

Everything needed to start building the denial-appeal pipeline without a clinic contact.

## Files

**`denial_reason_codes.json`** — The complete official NPHIES adjudication (denial) code system: 70 codes, English + Arabic, grouped into 5 categories (AD data errors, BE billing errors, CV coverage, SE missing documentation, MN medical necessity). Includes an appeal strategy note per category. This is the vocabulary of every denial in Saudi Arabia. Source: portal.nphies.sa (HL7 Saudi Arabia, v1.0.0).

**`synthetic_denials.json`** — 16 synthetic but realistic Saudi denial records across payers (Tawuniya, Bupa, MedGulf, etc.), claim types (outpatient, inpatient, pharmacy, dental, maternity), and languages (EN, AR, mixed). Each record has the denial letter free text (pipeline input) plus ground-truth classification and appeal angle (evaluation labels). Expand this set with an LLM using the same schema — vary payer wording, add scanned-quality noise, imbalance the categories realistically (SE and BE-1-4 are the most common in practice).

**`example_claimresponse_fhir.json`** — Official NPHIES example ClaimResponse in HL7 FHIR R4 (narrative stripped). Shows the exact wire format denials arrive in when you integrate directly later. More examples at `portal.nphies.sa/ig/ClaimResponse-<id>.json` (IDs: 173087, 483079, 618042, 142893, 293094, 48100, 964567).

## v1 pipeline this dataset supports

1. **Parse** — input: `denial_letter_text` (later: PDFs/scans via OCR). Extract: claim ref, payer, service, amount, denial code.
2. **Classify** — map denial code → category → appeal strategy (`denial_reason_codes.json` is your lookup table; no ML needed for coded denials).
3. **Generate** — draft the appeal letter (AR/EN) using the appeal strategy + claim facts. Validate output structure (Zod).
4. **Evaluate** — compare against `ground_truth` labels in the synthetic set.

## Not in this dataset (get from pilot clinics later)

Real denial PDFs/scans, payer-specific letter formats, appeals that actually won, payer adjudication quirks.

## Also worth downloading

- Adjudication error codes (validation-level rejections — scrubbing rules fodder): https://portal.nphies.sa/ig/CodeSystem-adjudication-error.json
- Full NPHIES Implementation Guide: https://portal.nphies.sa/ig/
- ICD-10-AM is the diagnosis code system used in KSA (note: -AM, the Australian modification, not plain ICD-10).
