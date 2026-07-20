import { ClaimStatus } from "./types";

/**
 * The claim state machine. Every module in the system is a transition handler:
 * coding: draft → coded | scrubbing: coded → scrubbed | submission: scrubbed → submitted
 * adjudication: submitted → paid|denied | appeals: denied → appealing → recovered|lost
 */
const TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  draft: ["coded"],
  coded: ["scrubbed", "draft"],
  scrubbed: ["submitted", "coded"],
  submitted: ["paid", "denied"],
  paid: [],
  denied: ["appealing", "lost"],
  appealing: ["recovered", "lost", "denied"], // denied = appeal rejected, may re-appeal
  recovered: [],
  lost: [],
};

export function canTransition(from: ClaimStatus, to: ClaimStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: ClaimStatus, to: ClaimStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid claim transition: ${from} → ${to}. Allowed from ${from}: [${TRANSITIONS[from]?.join(", ") || "none"}]`,
    );
  }
}

export function nextStates(from: ClaimStatus): ClaimStatus[] {
  return TRANSITIONS[from] ?? [];
}

/** Terminal states — no further action possible. */
export function isTerminal(status: ClaimStatus): boolean {
  return (TRANSITIONS[status] ?? []).length === 0;
}
