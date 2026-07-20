# Radd — Upcoming Complex Tasks

Ordered. Each is a real chunk of work; tackle top-down.

## Immediate (this week)
1. **Run first eval + tune** — `npm run eval` on qwen2.5:7b. Read the 3 scores (code extraction / classification / appealable). Fix the weakest step by adjusting prompts in `lib/pipeline/*.ts`. Re-run until code-extraction >90%, classification >75%.
2. **Model bake-off** — run the same eval on qwen2.5:7b vs 14b vs jais vs allam. Record scores in a table. Pick the smallest model that hits the bar (cheaper to deploy).
3. **Expand synthetic dataset** — grow from 16 → ~100 denials with a generation script, so eval numbers are trustworthy. Imbalance realistically (SE + BE-1-4 most common).

## Core build (weeks 2–5)
4. **PDF/image ingestion** — real denials arrive as scanned PDFs. Add local OCR (Tesseract) → feed text into the parse step. This is the biggest gap between demo and usable.
5. **Multi-tenant data layer** — Postgres/Supabase, `clinic_id` on every table, the `claims` state machine persisted, auth. Turns the script into a real app clinics can log into. (Note: prod DB must be KSA-hosted — PDPL.)
6. **Appeal export** — generate the final letter as a clean PDF/Word (Arabic RTL) the clinic can send.
7. **Human-in-the-loop review UI** — edit the draft appeal, approve, mark outcome (won/lost). Every edit = training data.

## Stickiness (weeks 6+)
8. **Denial analytics dashboard** — the module that makes clinics pay monthly. Charts of denial patterns + AI monthly summary.
9. **Claim scrubbing (pre-submission)** — rules engine using the adjudication-error codes. Prevents denials instead of just appealing them.
10. **Arabic clinical fine-tune** — the moat. Fine-tune Jais/AraBERT on clinical text once real data exists.

## Non-code but critical
- **Get 10–20 real anonymized denial letters** from clinic contacts. The whole product is shaped by real denials — this is the actual bottleneck, not code.
- **Confirm exact PDPL/SDAIA scope** — "strip identifiers + hosted API" vs "fully local" changes infra cost. Local-first keeps us safe under either reading.
- **Pick 1 pilot clinic** for a free trial in exchange for data + testimonial.

## Which need me (the AI) vs you
- Me: prompt tuning, dataset generation, OCR wiring, DB schema, dashboard, export, scrubbing rules.
- You: get real denial letters, pick pilot clinic, run evals locally, confirm regulations.
