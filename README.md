# Radd (رد) — AI Claims Recovery for Saudi Healthcare Providers

Radd is a local-first (PDPL-compliant) claims-recovery system for Saudi clinics. It owns the whole denial→recovery→prevention loop, not just letter-writing.

**Two working parts today:**

1. **Appeal generator** (`/`) — paste/upload a denial → parse → classify against official NPHIES codes → generate a review-ready appeal letter (EN/AR). Human approves before sending.
2. **Revenue Command Center** (`/dashboard`) — every claim over time: money at risk, recovered, and underpaid; appeal deadlines counting down; a payer scorecard; and denial-reason patterns. This is the part a chatbot structurally can't do — it needs memory of all claims, the official rules, and your contracts.

This dual view is the point: the dashboard is what makes Radd a *system* rather than a prompt.

Full system vision (7 modules, architecture, phases, business plan): `docs/build-plan.md`.

## Quick start

```bash
npm install
cp .env.example .env.local   # point at your LLM endpoint (defaults to local Ollama)
ollama pull qwen2.5:14b      # or any model you prefer — config via RADD_MODEL
npm run dev                  # app at localhost:3000
npm run eval                 # score the pipeline against 16 synthetic denials
```

**LLM is local-first:** all calls go through an OpenAI-compatible endpoint (`RADD_LLM_BASE_URL`) — Ollama for dev, vLLM on in-Kingdom infrastructure for production. PDPL data-residency rules mean real patient data must never leave Saudi Arabia; see `docs/build-plan.md` §6.

## Structure

- `lib/types.ts` — Zod schemas for every pipeline stage (validated LLM output, Signal Hire pattern)
- `lib/state-machine.ts` — the claim lifecycle; every future module is a transition handler
- `lib/denial-codes.ts` — lookup over all 71 official NPHIES denial codes (EN + AR)
- `lib/pipeline/` — parse → classify → generate-appeal
- `data/nphies/` — official code lists + synthetic denial dataset (see its README)
- `scripts/run-eval.ts` — accuracy scoring vs ground truth
- `app/` — minimal UI: textarea in, appeal letter out

## Principles

1. Human-in-the-loop always — Radd drafts, a person approves and sends. Never auto-submit.
2. No invented facts — missing clinical details become `[ATTACH: ...]` / `[CONFIRM: ...]` placeholders.
3. Deterministic before AI — official code lookup drives category; the LLM only does what rules can't.
4. Every decision logged — approvals/edits become training data (see build plan §5).

## Roadmap

v1 appeals (this) → v2 coding + scrubbing → v3 analytics + NPHIES integration. Details in `docs/build-plan.md` §7.
