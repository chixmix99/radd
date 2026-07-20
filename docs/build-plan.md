# Claims Copilot — Full System Build Plan

**One line:** An AI system for Saudi clinics that follows an insurance claim from patient check-in to payment — coding it, checking it, appealing it when denied, and learning from every rejection.

**Who pays:** Private clinics, polyclinics, and small hospital groups in KSA (~6,600 provider organizations, all forced onto the same NPHIES data standard — build once, sell to all).

**Working name suggestion:** pick something bilingual-friendly. "Mutalaba" (مطالبة = claim), "Claimly", "Radd" (رد = response/appeal). Decide later; use `claims-copilot` as the repo name for now.

---

## 1. The Landscape (why this works)

- Since 2026, every claim in Saudi private healthcare must flow through **NPHIES**, the national exchange, in a standardized HL7 FHIR R4 format. Docs: https://portal.nphies.sa/ig/
- Standardization is your friend: every clinic's claim data looks the same, so one product fits all of them.
- Claims get denied constantly (coding errors, missing pre-auth, policy mismatches). Denied claim = money the clinic earned but won't collect. Most small clinics don't fight denials — no time, no expertise.
- Existing tools (hospital ERPs, NPHIES middleware vendors) handle *submission plumbing*. Almost nobody does the *intelligence layer*: why was this denied, how do I fix it, how do I stop it happening. That gap is the product.
- **Your moat:** Saudi clinical notes are mixed Arabic/English. Every serious medical NLP model is English-only. Handle Arabic clinical text well and you're hard to copy.

---

## 2. The Modules (all seven, expanded)

Every module is a thin feature on one shared engine. Listed in claim-journey order, with build priority noted.

### Module A — Eligibility Check *(build: v3, nice-to-have)*
- **What:** Front desk confirms the patient is covered before treatment starts.
- **Input:** Patient ID / insurance card details.
- **Output:** Covered yes/no, plan name, co-pay, exclusions relevant to today's visit.
- **How:** NPHIES has a real-time eligibility transaction. Long-term, integrate with it. Short-term (no NPHIES access yet): parse the payer portals' exports or let staff paste policy details, and answer from stored policy data.
- **AI needed:** Minimal — mostly integration work, light RAG for exclusions.
- **Why it's last:** Needs live integration to be truly useful; lowest AI value-add.

### Module B — Policy Q&A Assistant *(build: v2.5, cheap add-on)*
- **What:** Staff asks in plain Arabic or English: "Does Bupa plan X cover MRI lower back?" Gets the answer with the exact clause cited.
- **Input:** Insurer policy documents, CHI unified policy rules (PDFs).
- **Output:** Answer + citation + confidence.
- **How:** Classic RAG. Chunk the policy PDFs, embed, retrieve, answer with citations. You've built this pattern before.
- **AI needed:** Embeddings (multilingual, e.g. `bge-m3`), an LLM for answering, a re-ranker if quality is poor.
- **Data you need:** Payer policy manuals + CHI's unified policy. Public or obtainable from any clinic client.
- **Why not first:** Useful, but doesn't directly recover money — weaker sales hook.

### Module C — Auto Medical Coding *(build: v2, the AI core)*
- **What:** Turn the doctor's free-text notes into the billing codes insurers require (ICD-10-AM diagnoses + Saudi Billing System / service codes).
- **Input:** Clinical note (often mixed Arabic/English), visit type.
- **Output:** Ranked code suggestions with the supporting text highlighted, coder approves/edits. **Never fully automatic — always human-in-the-loop.** That's both safer and easier to sell.
- **How (pipeline):**
  1. NER pass extracts clinical entities (diagnoses, procedures, meds) — start with `blaze999/Medical-NER` or Bio_ClinicalBERT for English.
  2. If text is Arabic: translate-then-extract for v1 (LLM translation is fine), fine-tune AraBERT on clinical text later as the moat play.
  3. Candidate code retrieval: embed the ICD-10 code descriptions, retrieve nearest codes for each entity (RAG over the code set — avoids hallucinated codes).
  4. LLM ranks candidates and writes a one-line justification per code (MedGemma or a general frontier LLM with the retrieved candidates in context).
- **Metric to track:** top-5 code accuracy vs. coder's final choice. >80% = product-grade assist.
- **Why it matters:** Coders are scarce/expensive in KSA; coding errors are a top denial cause. This feeds Module D directly.

### Module D — Claim Scrubbing (pre-submission check) *(build: v2)*
- **What:** Before the claim goes out, flag everything that will get it denied.
- **Input:** The assembled claim (codes, prices, patient info, attachments, pre-auth refs).
- **Output:** Pass/fail per rule + plain-language fix instructions, severity-ranked.
- **How (two layers — important):**
  1. **Deterministic rules engine** (no AI): required NPHIES fields present, code format valid, diagnosis-procedure compatibility, pre-auth reference present when service requires it, patient data matches eligibility. Encode NPHIES IG validation rules + payer-specific rules as data (JSON rules), not code, so adding a payer = adding rules, not redeploying.
  2. **AI layer on top:** LLM checks medical-necessity coherence ("does the diagnosis justify this procedure?") and learns new rules from Module F's denial patterns.
- **Why rules-first:** Deterministic checks are fast, explainable, and never hallucinate. AI catches what rules can't. Selling point: "we stop denials before they happen."

### Module E — Denial Appeal Generator *(build: v1 — START HERE)*
- **What:** Denied claim in → professional appeal letter out, in Arabic or English, citing policy and clinical justification.
- **Input:** Denial message (NPHIES ClaimResponse with denial codes, or a PDF/screenshot the clinic uploads), original claim, clinical note.
- **Output:** Draft appeal letter + a checklist of missing evidence to attach. Human reviews and sends.
- **How (pipeline):**
  1. Ingest denial: parse denial reason codes (NPHIES uses standard adjudication codes) or OCR + LLM extraction from uploaded PDFs.
  2. Classify denial type: coding error / missing documentation / no pre-auth / not covered / medical necessity dispute. Each type has a different appeal strategy.
  3. Retrieve ammunition: RAG over the payer policy + CHI rules to find clauses supporting the clinic's case.
  4. Generate: structured letter (facts → policy citation → clinical justification → request), Zod-validated output like Signal Hire.
  5. Track: log outcome (appeal won/lost) — this is training data and the analytics feed.
- **Why first:** It's Signal Hire's engine pointed at a new document type. Demoable in weeks. Immediate money-back value = easiest sale. **Requires zero NPHIES integration** — clinics can upload denial letters as PDFs. That kills your biggest dependency for v1.

### Module F — Denial Analytics *(build: v3, the retention layer)*
- **What:** Dashboard showing where the clinic bleeds money: denial rate by payer, by code, by doctor, by reason; appeal win rate; recovered revenue (your ROI proof).
- **Input:** Every claim and denial that passed through Modules C–E.
- **Output:** Charts + a monthly AI-written summary ("Top issue: 34% of Tawuniya denials are missing pre-auth on physio codes — fix: ...").
- **How:** Plain aggregation queries + one LLM call for the narrative summary. Technically the easiest module; its value comes from accumulated data.
- **Why it matters commercially:** It's the reason clinics *keep paying monthly*. It also displays "SAR X recovered this month" — your renewal argument.

### Module G — Prior-Auth Drafting *(build: v2.5)*
- **What:** For services needing insurer pre-approval, auto-assemble the justification package.
- **Input:** Planned service + clinical note + payer's pre-auth requirements.
- **Output:** Filled pre-auth request + checklist of required attachments.
- **How:** Same engine as Module E (retrieve payer requirements → generate structured justification). ~70% code reuse from E.

---

## 3. System Architecture

```
┌───────────────────────────────────────────────────────────┐
│  FRONTEND — Next.js + TypeScript (web app, RTL support)   │
│  Claims inbox · Review screens · Dashboard · Settings     │
└──────────────────────────┬────────────────────────────────┘
                           │ REST/tRPC
┌──────────────────────────┴────────────────────────────────┐
│  BACKEND API — Next.js API routes or FastAPI              │
│  Auth (multi-tenant) · Claim state machine · Queues       │
└─────┬──────────────┬─────────────────┬────────────────────┘
      │              │                 │
┌─────┴─────┐  ┌─────┴──────┐  ┌───────┴────────┐
│ AI SERVICE │  │ RULES      │  │ INTEGRATIONS   │
│ (Python/   │  │ ENGINE     │  │ v1: file upload│
│ FastAPI)   │  │ JSON rules │  │ v2: HIS export │
│ NER·coding │  │ per payer  │  │ v3: NPHIES FHIR│
│ RAG·genAI  │  └────────────┘  └────────────────┘
└─────┬──────┘
┌─────┴─────────────────────────────────────────────────────┐
│  DATA — Postgres (Supabase) + pgvector for embeddings     │
│  Object storage for uploaded PDFs · Audit log everything  │
└───────────────────────────────────────────────────────────┘
```

**Key architectural decisions:**

1. **Multi-tenant from day one.** Every table has `clinic_id`; row-level security in Supabase. This is what makes it "sellable to many customers" — one deployment, many clinics.
2. **Claim as a state machine.** One `claims` table with a status: `draft → coded → scrubbed → submitted → paid | denied → appealing → recovered | lost`. Every module is just a transition handler. This is the "one system, one thread" idea in code.
3. **AI service is a separate Python process.** Your Next.js app calls it over HTTP. Lets you swap models without touching the product, and deploy GPU stuff independently.
4. **Rules as data, not code.** Payer quirks live in JSON rule files. New payer = new file.
5. **Integration ladder — don't block on NPHIES:**
   - **v1:** clinics upload files (denial PDFs, Excel claim exports). Every clinic can do this today. Zero integration risk.
   - **v2:** import from their HIS/clinic-management system exports (top 3–4 systems cover most of the market).
   - **v3:** direct NPHIES FHIR integration (HL7 FHIR R4, docs at portal.nphies.sa/ig). Requires onboarding as a solution vendor — start conversations early, but never let v1 wait on it.
6. **Audit log everything.** Healthcare + money = every AI suggestion, human edit, and submission must be traceable. Also generates your fine-tuning data.

---

## 4. Data Model (core tables)

- `clinics` — tenant root; settings, payer list, subscription tier
- `users` — roles: front-desk, coder, billing manager, admin
- `patients` — minimal PHI, encrypted at rest (see §6)
- `claims` — the spine; status, payer, amounts, episode ID, NPHIES refs
- `claim_items` — line items with codes, quantities, prices
- `clinical_notes` — raw text + extracted entities (JSON)
- `code_suggestions` — AI suggestions + human decision (accept/edit/reject) ← training data
- `scrub_results` — rule hits per claim per run
- `denials` — reason codes, classified type, linked claim
- `appeals` — generated letter, human edits, submitted date, outcome ← training data + ROI proof
- `payer_policies` — documents + chunk embeddings (pgvector)
- `payer_rules` — JSON rule sets per payer
- `audit_log` — who/what/when for every action

---

## 5. AI Stack (model per job)

| Job | v1 (ship fast) | Later (moat) |
|---|---|---|
| Denial parsing (PDF/OCR) | Frontier LLM w/ vision, or Tesseract + LLM | Fine-tuned layout model |
| Denial classification | LLM few-shot | Small fine-tuned classifier (cheap, fast) |
| Appeal generation | Frontier LLM + RAG, Zod-validated output | Fine-tune on your own won-appeals data |
| Clinical NER (EN) | `blaze999/Medical-NER`, Bio_ClinicalBERT | Clinical ModernBERT (8k context) |
| Clinical text (AR) | Translate→extract via LLM | **AraBERT fine-tuned on clinical text — the moat. Also a publishable MSc-adjacent project.** |
| Code retrieval | Embed ICD-10 descriptions, pgvector search | Add Saudi Billing System codes |
| Code ranking | LLM over retrieved candidates | MedGemma / fine-tuned ranker |
| Policy RAG | `bge-m3` embeddings (multilingual) + LLM | Re-ranker; payer-specific indexes |
| Analytics narrative | One LLM call over aggregates | — |

**Principles:** RAG over fine-tuning until you have your own data. Retrieval-constrained codes only (never let the LLM invent a code). Every AI output is a *suggestion* a human approves — safer, sells better, and every approval becomes training data.

**Cost control:** small/local models for NER + embeddings; frontier LLM only for generation steps. Cache policy retrievals per payer.

---

## 6. Compliance & Trust (can't skip in healthcare)

- **PDPL (Saudi data protection law):** patient data must be handled under Saudi rules — host in a KSA or compliant region (Supabase won't cut it for production PHI; plan migration to a KSA-region cloud e.g. STC Cloud / Oracle Jeddah / AWS Bahrain for the paid version. Supabase is fine for the demo with anonymized data).
- **PHI minimization:** store only what the claim needs; encrypt PHI columns; strip identifiers before sending text to any external LLM API — or use a KSA-hosted model for PHI-touching steps.
- **Positioning:** you are a *decision-support tool*, not a medical device and not auto-submitting anything in v1. Human approves everything. Say this everywhere; it keeps you out of regulatory scope and builds trust.
- **NPHIES vendor onboarding:** to integrate directly later you'll register as a solution vendor with CHI. Start the paperwork during v2.

---

## 7. Build Phases

### Phase 0 — Foundation (week 1–2)
- Repo, Next.js + TS + Supabase multi-tenant skeleton, auth, claims table + state machine, file upload.
- Collect real artifacts: **get 10–20 real (anonymized) denial letters and claims** from any clinic contact. This is the single most important non-code task — the product is shaped by real denials, not imagined ones.

### Phase 1 — v1: Appeals tool (week 3–8) ← the sellable demo
- Upload denial (PDF/image/text) → parse → classify → generate appeal (AR + EN) → edit → export as PDF/Word.
- Policy RAG for 2 payers only (e.g. Tawuniya + Bupa) — don't boil the ocean.
- Outcome tracking (won/lost, SAR recovered).
- **Definition of done:** a clinic user uploads a real denial and gets a usable appeal letter in <2 minutes.
- Put it on the CV the day it demos.

### Phase 2 — v2: The AI core (month 3–5)
- Auto-coding module (EN pipeline first, translate-bridge for AR).
- Scrubbing rules engine (NPHIES IG base rules + your 2 payers).
- HIS export import (pick the 1–2 most common clinic systems your pilot uses).
- Pilot with 2–5 clinics: free or cheap, in exchange for data and testimonials.

### Phase 3 — v3: Stickiness + scale (month 6+)
- Denial analytics dashboard + monthly AI summary.
- Prior-auth drafting (reuse appeal engine).
- Policy Q&A assistant.
- AraBERT clinical fine-tune (moat + potential publication).
- NPHIES direct integration + KSA hosting migration.
- Eligibility checks last.

---

## 8. Business Layer

- **Model:** B2B SaaS, monthly per clinic. Suggested tiers: Starter (appeals only, ~SAR 500–1,000/mo), Pro (+ coding/scrubbing, ~SAR 2,000–4,000/mo), Group (multi-branch, custom). Alternative hook for v1: **success-based pricing on appeals (10–15% of recovered SAR)** — zero-risk for the clinic, easiest possible "yes", and it prices on value.
- **The sales math that sells itself:** a mid-size polyclinic submitting SAR 500k/month with a 15% denial rate has SAR 75k/month stuck. Recover even a third of it and the tool pays for itself 10x. Lead with this arithmetic in every pitch.
- **GTM (matches your reality):** you don't need marketing at first — you need **5 pilot clinics through personal networks** (your Riyadh contacts, the person who gave you the hint, family/friends who know clinic owners). Their results become the case study that gets the next 20.
- **Who you sell to inside the clinic:** the owner or billing/insurance manager — the person who feels denied money personally.
- **CV angle (your stated main goal):** even at pilot stage this reads as: *"Built and deployed a multi-tenant AI claims-recovery platform for Saudi healthcare providers (Next.js, FastAPI, RAG, clinical NER, Arabic/English); recovered SAR X in denied claims across N pilot clinics."* That sentence works for AI-engineer roles, product roles, and founder credibility simultaneously.

---

## 9. Risks & Honest Caveats

1. **Data access is the real bottleneck, not tech.** Without real denial letters you're building blind. Solve this in week 1–2 or pause.
2. **Sales cycles:** even small clinics take weeks to decide. The success-fee model shortens this.
3. **Incumbents:** NPHIES middleware vendors could add AI features. Your speed + Arabic depth + denial focus is the counter.
4. **LLM errors in healthcare:** never auto-submit; always human-in-the-loop; log everything. One bad hallucinated appeal at a pilot clinic kills trust permanently.
5. **Scope creep — the plan's biggest enemy.** Seven modules is the map, not the to-do list. **v1 is one module.** Resist building sideways until appeals works end-to-end with a real clinic.

---

## 10. This Week (concrete)

1. Message your contact (the hint-giver) and any clinic connections: ask for 10 anonymized denial letters + what they currently do about them.
2. Skim the NPHIES claim + adjudication pages: https://portal.nphies.sa/ig/usecase-claims.html — you only need the denial/response codes list for v1.
3. Scaffold the repo (reuse Signal Hire's structure: Next.js, TS, Supabase, Zod pipelines).
4. Build the thinnest slice: upload one denial PDF → LLM extracts reason → generates one appeal letter. One file in, one letter out. Everything else grows from that.
