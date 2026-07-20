import claimsData from "@/data/nphies/synthetic_claims.json";

export interface Claim {
  id: string;
  payer: string;
  service: string;
  icd10: string;
  billedSar: number;
  contractedSar: number;
  paidSar: number;
  status: "paid" | "denied" | "appealing" | "recovered" | "lost";
  denialCode: string | null;
  denialReason: string | null;
  createdDate: string;
  appealDeadline: string | null;
  doctor: string;
}

interface ClaimsFile {
  generatedFor: string;
  claims: Claim[];
}

const file = claimsData as unknown as ClaimsFile;

export function allClaims(): Claim[] {
  return file.claims;
}

/** "Today" for the dataset — deadlines are relative to this. */
export function referenceDate(): Date {
  return new Date(file.generatedFor);
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export interface HeadlineMetrics {
  atRiskSar: number; // money stuck in denied + appealing
  recoveredSar: number; // money won back via appeals
  lostSar: number; // appeals lost / not pursued
  underpaidSar: number; // paid less than contracted
  paidSar: number; // cleanly paid
  denialRatePct: number; // denied+appealing+recovered+lost / all
  totalClaims: number;
  recoveryRatePct: number; // recovered / (recovered + lost) of resolved appeals
}

export function headlineMetrics(claims: Claim[] = allClaims()): HeadlineMetrics {
  const atRisk = sum(
    claims.filter((c) => c.status === "denied" || c.status === "appealing").map((c) => c.contractedSar),
  );
  const recovered = sum(claims.filter((c) => c.status === "recovered").map((c) => c.paidSar));
  const lost = sum(claims.filter((c) => c.status === "lost").map((c) => c.contractedSar));
  const underpaid = sum(
    claims
      .filter((c) => c.status === "paid" && c.paidSar < c.contractedSar)
      .map((c) => c.contractedSar - c.paidSar),
  );
  const paid = sum(claims.filter((c) => c.status === "paid").map((c) => c.paidSar));
  const denialsCount = claims.filter((c) => c.status !== "paid").length;
  const recoveredN = claims.filter((c) => c.status === "recovered").length;
  const lostN = claims.filter((c) => c.status === "lost").length;

  return {
    atRiskSar: atRisk,
    recoveredSar: recovered,
    lostSar: lost,
    underpaidSar: underpaid,
    paidSar: paid,
    denialRatePct: claims.length ? Math.round((denialsCount / claims.length) * 100) : 0,
    totalClaims: claims.length,
    recoveryRatePct: recoveredN + lostN ? Math.round((recoveredN / (recoveredN + lostN)) * 100) : 0,
  };
}

export interface PayerRow {
  payer: string;
  total: number;
  denied: number;
  denialRatePct: number;
  atRiskSar: number;
  underpaidSar: number;
}

export function payerScorecard(claims: Claim[] = allClaims()): PayerRow[] {
  const byPayer = new Map<string, Claim[]>();
  for (const c of claims) {
    if (!byPayer.has(c.payer)) byPayer.set(c.payer, []);
    byPayer.get(c.payer)!.push(c);
  }
  const rows: PayerRow[] = [];
  for (const [payer, cs] of byPayer) {
    const denied = cs.filter((c) => c.status !== "paid").length;
    rows.push({
      payer,
      total: cs.length,
      denied,
      denialRatePct: Math.round((denied / cs.length) * 100),
      atRiskSar: sum(
        cs.filter((c) => c.status === "denied" || c.status === "appealing").map((c) => c.contractedSar),
      ),
      underpaidSar: sum(
        cs.filter((c) => c.status === "paid" && c.paidSar < c.contractedSar).map((c) => c.contractedSar - c.paidSar),
      ),
    });
  }
  return rows.sort((a, b) => b.atRiskSar - a.atRiskSar);
}

export interface ReasonRow {
  code: string;
  reason: string;
  count: number;
  valueSar: number;
}

export function denialsByReason(claims: Claim[] = allClaims()): ReasonRow[] {
  const byCode = new Map<string, ReasonRow>();
  for (const c of claims) {
    if (!c.denialCode || c.status === "paid" || c.status === "recovered") continue;
    const row = byCode.get(c.denialCode) ?? {
      code: c.denialCode,
      reason: c.denialReason ?? "",
      count: 0,
      valueSar: 0,
    };
    row.count += 1;
    row.valueSar += c.contractedSar;
    byCode.set(c.denialCode, row);
  }
  return [...byCode.values()].sort((a, b) => b.valueSar - a.valueSar);
}

export interface DeadlineRow {
  id: string;
  payer: string;
  service: string;
  amountSar: number;
  deadline: string;
  daysLeft: number;
}

/** Appeals with a live deadline, most urgent first. Negative daysLeft = overdue. */
export function upcomingDeadlines(claims: Claim[] = allClaims()): DeadlineRow[] {
  const ref = referenceDate().getTime();
  const day = 1000 * 60 * 60 * 24;
  return claims
    .filter((c) => c.appealDeadline && (c.status === "appealing" || c.status === "denied"))
    .map((c) => ({
      id: c.id,
      payer: c.payer,
      service: c.service,
      amountSar: c.contractedSar,
      deadline: c.appealDeadline!,
      daysLeft: Math.round((new Date(c.appealDeadline!).getTime() - ref) / day),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export interface UnderpaymentRow {
  id: string;
  payer: string;
  service: string;
  contractedSar: number;
  paidSar: number;
  shortfallSar: number;
}

/** Claims the payer paid, but paid less than the contracted rate. */
export function underpayments(claims: Claim[] = allClaims()): UnderpaymentRow[] {
  return claims
    .filter((c) => c.status === "paid" && c.paidSar < c.contractedSar)
    .map((c) => ({
      id: c.id,
      payer: c.payer,
      service: c.service,
      contractedSar: c.contractedSar,
      paidSar: c.paidSar,
      shortfallSar: c.contractedSar - c.paidSar,
    }))
    .sort((a, b) => b.shortfallSar - a.shortfallSar);
}

export function formatSar(n: number): string {
  return "SAR " + n.toLocaleString("en-US");
}
