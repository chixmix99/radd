import codesData from "@/data/nphies/denial_reason_codes.json";
import { DenialCategory } from "./types";

export interface DenialCode {
  code: string;
  category: DenialCategory;
  en: string;
  ar: string;
}

interface CodesFile {
  categories: Record<string, string>;
  appeal_strategy_by_category: Record<string, string>;
  codes: DenialCode[];
}

const data = codesData as unknown as CodesFile;

const byCode = new Map<string, DenialCode>(data.codes.map((c) => [c.code.toUpperCase(), c]));

/** Look up an official NPHIES denial code (case-insensitive). */
export function lookupDenialCode(code: string | null | undefined): DenialCode | null {
  if (!code) return null;
  return byCode.get(code.trim().toUpperCase()) ?? null;
}

/** Category-level appeal strategy from the official taxonomy. */
export function strategyForCategory(category: DenialCategory): string {
  return data.appeal_strategy_by_category[category] ?? "";
}

export function categoryDescription(category: DenialCategory): string {
  return data.categories[category] ?? "";
}

export function allCodes(): DenialCode[] {
  return data.codes;
}
