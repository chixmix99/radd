"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { allClaims, type Claim } from "@/lib/metrics";

interface ClaimsCtx {
  claims: Claim[];
  source: "demo" | "imported";
  importedCount: number;
  loadClaims: (claims: Claim[]) => void;
  resetToDemo: () => void;
}

const Ctx = createContext<ClaimsCtx>({
  claims: [],
  source: "demo",
  importedCount: 0,
  loadClaims: () => {},
  resetToDemo: () => {},
});

export function useClaims() {
  return useContext(Ctx);
}

const KEY = "radd-claims";

export function ClaimsProvider({ children }: { children: ReactNode }) {
  const demo = allClaims();
  const [claims, setClaims] = useState<Claim[]>(demo);
  const [source, setSource] = useState<"demo" | "imported">("demo");

  // restore imported data if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Claim[];
        if (Array.isArray(parsed) && parsed.length) {
          setClaims(parsed);
          setSource("imported");
        }
      } catch {
        /* ignore corrupt cache */
      }
    }
  }, []);

  const loadClaims = (next: Claim[]) => {
    setClaims(next);
    setSource("imported");
    if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  };

  const resetToDemo = () => {
    setClaims(demo);
    setSource("demo");
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
  };

  return (
    <Ctx.Provider
      value={{ claims, source, importedCount: source === "imported" ? claims.length : 0, loadClaims, resetToDemo }}
    >
      {children}
    </Ctx.Provider>
  );
}
