# Radd Dashboard — Feature Roadmap

## Already built
- 5 headline KPIs: at-risk, recovered, underpaid, denial rate, appeal win rate
- Appeal deadlines table (overdue / due-soon badges)
- Denials-by-reason bars (ranked by lost value)
- Payer scorecard (denial % + underpayment per payer)
- Underpayments table (paid below contracted rate)
- Full EN/AR toggle with RTL

## Data available to build on
Each claim already has: `id, payer, service, icd10, billedSar, contractedSar, paidSar, status, denialCode, denialReason, createdDate, appealDeadline, doctor`. Enough for every feature below — no new data collection needed.

---

## Tier 1 — makes it a real system (build first)

### 1. Trend over time
Monthly chart: denials vs recoveries (and SAR values). Shows direction, not just a snapshot.
- New metric: `monthlyTrend()` groups claims by month of `createdDate`.
- UI: simple bar/line (inline SVG or a tiny chart lib). Bilingual month labels.

### 2. Claims worklist (closes the loop)
A filterable, searchable table of ALL claims with status badges. Denied rows get a "Recover →" button that opens the appeal generator prefilled with that claim's denial.
- This connects `/dashboard` and `/` into one workflow — the single most important add.
- New metric: `listClaims({status, payer, search})`.
- UI: table + status filter chips + search box + row action.

### 3. Aging buckets
Money stuck grouped by age: 0–30 / 30–60 / 60–90 / 90+ days. The standard revenue-cycle metric — instant credibility with clinic managers.
- New metric: `agingBuckets()` from `createdDate` of unresolved claims.
- UI: 4 mini-cards or a stacked bar.

---

## Tier 2 — depth & root-cause

### 4. Denials by doctor
Which doctor generates the most denials → points to a documentation/training fix. Handle tactfully (it's about process, not blame).
- New metric: `denialsByDoctor()`.

### 5. Filters (make it interactive)
Global filter bar: payer / status / date range. Every panel recomputes. Turns a static report into a tool.
- Client state; metric functions already accept a claims array, so pass a filtered subset.

### 6. AI monthly summary
Local LLM writes a plain-language paragraph: "This month SAR X lost, mostly missing pre-auth on physio; 3 appeals expire this week." Ties Ollama into the dashboard — a real differentiator vs a static BI tool.
- New endpoint `/api/summary` feeding aggregated numbers to the model.

---

## Tier 3 — polish

### 7. Export
Download the current view as CSV (and later a branded PDF) for the clinic's records.

### 8. Recovery funnel
Visual: denied → appealed → recovered / lost, with drop-off at each stage.

---

## Suggested build order
1 → 2 → 3 (Tier 1 first: trend, worklist, aging) → then 5 (filters) and 6 (AI summary) → polish last.

The worklist (#2) is the highest-leverage single item — it's what makes the appeal tool and the dashboard one product instead of two demos.
