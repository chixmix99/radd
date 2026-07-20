import type { Claim } from "./metrics";

/** Minimal, dependency-free CSV parser. Handles quotes, commas, and newlines in fields. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Canonical field → accepted header aliases (lowercased, EN + AR). */
const HEADER_ALIASES: Record<keyof ClaimInput, string[]> = {
  id: ["id", "claim", "claim id", "claimid", "claim number", "claim no", "رقم المطالبة", "المطالبة", "رقم"],
  payer: ["payer", "insurer", "insurance", "insurance company", "الشركة", "شركة التأمين", "التأمين"],
  service: ["service", "procedure", "service description", "الخدمة", "الإجراء", "وصف الخدمة"],
  icd10: ["icd", "icd10", "icd-10", "diagnosis", "diagnosis code", "التشخيص", "رمز التشخيص"],
  billedSar: ["billed", "billed amount", "amount", "claimed", "المبلغ", "المطالب به", "المبلغ المطالب"],
  contractedSar: ["contracted", "contract", "contracted amount", "tariff", "agreed", "المتعاقد", "السعر المتعاقد", "المبلغ المتعاقد"],
  paidSar: ["paid", "paid amount", "settled", "المدفوع", "المبلغ المدفوع"],
  status: ["status", "claim status", "الحالة", "حالة المطالبة"],
  denialCode: ["denial code", "code", "rejection code", "denial", "رمز الرفض", "كود الرفض"],
  denialReason: ["reason", "denial reason", "rejection reason", "سبب الرفض", "السبب"],
  createdDate: ["date", "created", "created date", "service date", "claim date", "التاريخ", "تاريخ الخدمة", "تاريخ المطالبة"],
  appealDeadline: ["deadline", "appeal deadline", "الموعد النهائي", "موعد الاعتراض"],
  doctor: ["doctor", "physician", "provider", "clinician", "الطبيب", "مقدم الخدمة"],
};

interface ClaimInput {
  id: string;
  payer: string;
  service: string;
  icd10: string;
  billedSar: string;
  contractedSar: string;
  paidSar: string;
  status: string;
  denialCode: string;
  denialReason: string;
  createdDate: string;
  appealDeadline: string;
  doctor: string;
}

const STATUS_MAP: Record<string, Claim["status"]> = {
  paid: "paid", مدفوعة: "paid", مدفوع: "paid",
  denied: "denied", rejected: "denied", مرفوضة: "denied", مرفوض: "denied", رفض: "denied",
  appealing: "appealing", appeal: "appealing", "under appeal": "appealing", "قيد الاعتراض": "appealing", اعتراض: "appealing",
  recovered: "recovered", won: "recovered", مسترجعة: "recovered", مسترجع: "recovered",
  lost: "lost", خاسرة: "lost", خسارة: "lost",
};

function num(s: string): number {
  const cleaned = (s || "").replace(/[^0-9.\-]/g, "");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalizeHeader(h: string): keyof ClaimInput | null {
  const key = h.trim().toLowerCase();
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES) as [keyof ClaimInput, string[]][]) {
    if (aliases.includes(key)) return canonical;
  }
  return null;
}

export interface ImportResult {
  claims: Claim[];
  rowCount: number;
  errors: string[];
  matchedColumns: string[];
  unmatchedHeaders: string[];
}

/** Map parsed CSV rows into Claim objects, tolerant of column naming and language. */
export function rowsToClaims(rows: string[][]): ImportResult {
  const errors: string[] = [];
  if (rows.length < 2) {
    return { claims: [], rowCount: 0, errors: ["File has no data rows."], matchedColumns: [], unmatchedHeaders: [] };
  }

  const header = rows[0];
  const colMap = new Map<number, keyof ClaimInput>();
  const unmatched: string[] = [];
  header.forEach((h, i) => {
    const c = normalizeHeader(h);
    if (c) colMap.set(i, c);
    else if (h.trim()) unmatched.push(h.trim());
  });

  const matched = [...new Set(colMap.values())];
  if (!matched.includes("payer") && !matched.includes("id")) {
    errors.push("Could not find key columns (need at least a claim ID or payer). Check the template.");
  }

  const claims: Claim[] = [];
  for (let r = 1; r < rows.length; r++) {
    const raw = rows[r];
    const rec: Partial<ClaimInput> = {};
    colMap.forEach((field, i) => {
      rec[field] = (raw[i] ?? "").trim();
    });

    const billed = num(rec.billedSar ?? "");
    const contracted = rec.contractedSar ? num(rec.contractedSar) : billed;
    const paid = num(rec.paidSar ?? "");
    const code = rec.denialCode?.trim() || null;

    // infer status if not provided
    let status: Claim["status"];
    const statusRaw = (rec.status ?? "").trim().toLowerCase();
    if (statusRaw && STATUS_MAP[statusRaw]) {
      status = STATUS_MAP[statusRaw];
    } else if (paid > 0 && (!code || paid >= contracted)) {
      status = "paid";
    } else if (code) {
      status = "denied";
    } else {
      status = "paid";
    }

    claims.push({
      id: rec.id?.trim() || `ROW-${r}`,
      payer: rec.payer?.trim() || "Unknown",
      service: rec.service?.trim() || "—",
      icd10: rec.icd10?.trim() || "",
      billedSar: billed,
      contractedSar: contracted,
      paidSar: paid,
      status,
      denialCode: code,
      denialReason: rec.denialReason?.trim() || null,
      createdDate: rec.createdDate?.trim() || new Date().toISOString().slice(0, 10),
      appealDeadline: rec.appealDeadline?.trim() || null,
      doctor: rec.doctor?.trim() || "—",
    });
  }

  return {
    claims,
    rowCount: claims.length,
    errors,
    matchedColumns: matched,
    unmatchedHeaders: unmatched,
  };
}

/** A CSV template string the clinic can fill in. */
export function csvTemplate(): string {
  const headers = [
    "Claim ID", "Payer", "Service", "ICD10", "Billed", "Contracted", "Paid",
    "Status", "Denial Code", "Denial Reason", "Date", "Appeal Deadline", "Doctor",
  ];
  const example = [
    "CLM-1001", "Tawuniya", "MRI Lumbar Spine", "M54.5", "1850", "1850", "0",
    "denied", "BE-1-4", "Preauthorization not obtained", "2026-06-12", "2026-07-12", "Dr. Al-Harbi",
  ];
  const example2 = [
    "CLM-1002", "Bupa Arabia", "Consultation", "E11.9", "300", "300", "300",
    "paid", "", "", "2026-06-15", "", "Dr. Khan",
  ];
  return [headers, example, example2].map((r) => r.join(",")).join("\n");
}
