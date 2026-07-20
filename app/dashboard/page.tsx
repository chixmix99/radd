"use client";

import Link from "next/link";
import {
  headlineMetrics,
  payerScorecard,
  denialsByReason,
  upcomingDeadlines,
  underpayments,
} from "@/lib/metrics";
import { t, money } from "@/lib/i18n";
import { useLang, LangToggle } from "../LanguageProvider";
import { useClaims } from "../ClaimsProvider";
import { ImportPanel } from "../ImportPanel";

export default function Dashboard() {
  const { lang, dir } = useLang();
  const { claims, source } = useClaims();
  const m = headlineMetrics(claims);
  const payers = payerScorecard(claims);
  const reasons = denialsByReason(claims);
  // demo data uses its baked-in reference date; imported data uses real today
  const deadlines = upcomingDeadlines(claims, source === "imported" ? new Date() : undefined);
  const under = underpayments(claims);
  const maxReasonVal = Math.max(...reasons.map((r) => r.valueSar), 1);
  const overdue = deadlines.filter((d) => d.daysLeft < 0).length;
  const urgent = deadlines.filter((d) => d.daysLeft >= 0 && d.daysLeft <= 5).length;

  return (
    <div dir={dir}>
      <div style={s.brandbar}>
        <div style={s.brandInner}>
          <div style={s.brandLeft}>
            <div style={s.logo}>رد</div>
            <div>
              <div style={s.brandName}>Radd</div>
              <div style={s.brandTag}>{t("brandTag", lang)}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <LangToggle />
            <ImportPanel />
            <Link href="/" className="radd-btn" style={s.navBtn}>
              {t("newAppeal", lang)}
            </Link>
          </div>
        </div>
      </div>

      <main style={s.page}>
        <div style={s.titleRow}>
          <div>
            <h1 style={s.h1}>{t("dashTitle", lang)}</h1>
            <p style={s.sub}>{t("dashSub", lang)}</p>
          </div>
          {(overdue > 0 || urgent > 0) && (
            <div style={s.alertPill}>
              {overdue > 0 && <span>{overdue} {t("overdue", lang)}</span>}
              {overdue > 0 && urgent > 0 && <span style={{ opacity: 0.5 }}>·</span>}
              {urgent > 0 && <span>{urgent} {t("dueSoon", lang)}</span>}
            </div>
          )}
        </div>

        <section className="radd-kpirow" style={s.cardRow}>
          <Kpi label={t("kAtRisk", lang)} value={money(m.atRiskSar, lang)} note={t("kAtRiskNote", lang)} tone="danger" icon="⚠" />
          <Kpi label={t("kRecovered", lang)} value={money(m.recoveredSar, lang)} note={t("kRecoveredNote", lang)} tone="good" icon="↩" />
          <Kpi label={t("kUnderpaid", lang)} value={money(m.underpaidSar, lang)} note={t("kUnderpaidNote", lang)} tone="warn" icon="≈" />
          <Kpi label={t("kDenialRate", lang)} value={`${m.denialRatePct}%`} note={`${m.totalClaims} ${t("kClaims", lang)}`} tone="neutral" icon="%" />
          <Kpi label={t("kWinRate", lang)} value={`${m.recoveryRatePct}%`} note={t("kWinNote", lang)} tone="good" icon="✓" />
        </section>

        <div className="radd-grid" style={s.grid}>
          <Panel title={t("pDeadlines", lang)} subtitle={t("pDeadlinesSub", lang)} accent="#dc2626" dir={dir}>
            <table style={s.table}>
              <thead>
                <tr>
                  <Th dir={dir}>{t("cClaim", lang)}</Th>
                  <Th dir={dir}>{t("cPayer", lang)}</Th>
                  <Th dir={dir} end>{t("cAmount", lang)}</Th>
                  <Th dir={dir} end>{t("cDaysLeft", lang)}</Th>
                </tr>
              </thead>
              <tbody>
                {deadlines.slice(0, 8).map((d) => (
                  <tr key={d.id}>
                    <Td dir={dir} mono>{d.id}</Td>
                    <Td dir={dir}>{d.payer}</Td>
                    <Td dir={dir} end>{money(d.amountSar, lang)}</Td>
                    <Td dir={dir} end>
                      <span style={deadlineBadge(d.daysLeft)}>
                        {d.daysLeft < 0
                          ? `${Math.abs(d.daysLeft)}${t("dDay", lang)} ${t("dOverdue", lang)}`
                          : `${d.daysLeft}${t("dDay", lang)}`}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title={t("pReasons", lang)} subtitle={t("pReasonsSub", lang)} accent="#7c3aed" dir={dir}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reasons.slice(0, 7).map((r) => (
                <div key={r.code}>
                  <div style={s.barLabel}>
                    <span>
                      <strong style={{ color: "#334155" }}>{r.code}</strong>
                      <span style={{ color: "#64748b" }}> · {r.reason}</span>
                    </span>
                    <span style={{ color: "#64748b", whiteSpace: "nowrap", margin: "0 8px" }}>
                      {r.count}× · {money(r.valueSar, lang)}
                    </span>
                  </div>
                  <div style={s.barTrack} dir="ltr">
                    <div style={{ ...s.barFill, width: `${(r.valueSar / maxReasonVal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={t("pPayers", lang)} subtitle={t("pPayersSub", lang)} accent="#0891b2" dir={dir}>
            <table style={s.table}>
              <thead>
                <tr>
                  <Th dir={dir}>{t("cPayer", lang)}</Th>
                  <Th dir={dir} end>{t("cDenialPct", lang)}</Th>
                  <Th dir={dir} end>{t("cAtRisk", lang)}</Th>
                  <Th dir={dir} end>{t("cUnderpaid", lang)}</Th>
                </tr>
              </thead>
              <tbody>
                {payers.map((p) => (
                  <tr key={p.payer}>
                    <Td dir={dir}>{p.payer}</Td>
                    <Td dir={dir} end><span style={ratePill(p.denialRatePct)}>{p.denialRatePct}%</span></Td>
                    <Td dir={dir} end>{money(p.atRiskSar, lang)}</Td>
                    <Td dir={dir} end>{money(p.underpaidSar, lang)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title={t("pUnder", lang)} subtitle={t("pUnderSub", lang)} accent="#b45309" dir={dir}>
            <table style={s.table}>
              <thead>
                <tr>
                  <Th dir={dir}>{t("cClaim", lang)}</Th>
                  <Th dir={dir}>{t("cPayer", lang)}</Th>
                  <Th dir={dir} end>{t("cContracted", lang)}</Th>
                  <Th dir={dir} end>{t("cPaid", lang)}</Th>
                  <Th dir={dir} end>{t("cShortfall", lang)}</Th>
                </tr>
              </thead>
              <tbody>
                {under.slice(0, 8).map((u) => (
                  <tr key={u.id}>
                    <Td dir={dir} mono>{u.id}</Td>
                    <Td dir={dir}>{u.payer}</Td>
                    <Td dir={dir} end>{money(u.contractedSar, lang)}</Td>
                    <Td dir={dir} end>{money(u.paidSar, lang)}</Td>
                    <Td dir={dir} end><span style={{ color: "#b45309", fontWeight: 700 }}>{money(u.shortfallSar, lang)}</span></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>

        <footer style={s.footer}>
          <span style={s.dot} /> {t("footer", lang)}
        </footer>
      </main>
    </div>
  );
}

function Kpi({ label, value, note, tone, icon }: { label: string; value: string; note: string; tone: "good" | "danger" | "warn" | "neutral"; icon: string }) {
  const accent = { good: "#059669", danger: "#dc2626", warn: "#b45309", neutral: "#334155" }[tone];
  const soft = { good: "#ecfdf5", danger: "#fef2f2", warn: "#fffbeb", neutral: "#f1f5f9" }[tone];
  return (
    <div className="radd-kpi" style={{ ...s.kpi, borderTop: `3px solid ${accent}` }}>
      <div style={s.kpiTop}>
        <span style={s.kpiLabel}>{label}</span>
        <span style={{ ...s.kpiIcon, background: soft, color: accent }}>{icon}</span>
      </div>
      <div style={{ ...s.kpiValue, color: accent }}>{value}</div>
      <div style={s.kpiNote}>{note}</div>
    </div>
  );
}

function Panel({ title, subtitle, accent, dir, children }: { title: string; subtitle: string; accent: string; dir: "ltr" | "rtl"; children: React.ReactNode }) {
  return (
    <section className="radd-panel" style={s.panel}>
      <div style={s.panelHead}>
        <span style={{ ...s.panelAccent, background: accent }} />
        <div>
          <h2 style={s.panelTitle}>{title}</h2>
          <p style={s.panelSub}>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Th({ children, end, dir }: { children: React.ReactNode; end?: boolean; dir: "ltr" | "rtl" }) {
  const align = end ? (dir === "rtl" ? "left" : "right") : dir === "rtl" ? "right" : "left";
  return <th style={{ ...s.th, textAlign: align }}>{children}</th>;
}
function Td({ children, end, mono, dir }: { children: React.ReactNode; end?: boolean; mono?: boolean; dir: "ltr" | "rtl" }) {
  const align = end ? (dir === "rtl" ? "left" : "right") : dir === "rtl" ? "right" : "left";
  return (
    <td style={{ ...s.td, textAlign: align, fontVariantNumeric: "tabular-nums", fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined, fontSize: mono ? 12 : undefined, color: mono ? "#475569" : undefined }}>
      {children}
    </td>
  );
}

function deadlineBadge(daysLeft: number): React.CSSProperties {
  const base: React.CSSProperties = { padding: "3px 9px", borderRadius: 999, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" };
  if (daysLeft < 0) return { ...base, background: "#fee2e2", color: "#b91c1c" };
  if (daysLeft <= 5) return { ...base, background: "#fef3c7", color: "#b45309" };
  return { ...base, background: "#dcfce7", color: "#15803d" };
}
function ratePill(pct: number): React.CSSProperties {
  const base: React.CSSProperties = { padding: "2px 8px", borderRadius: 999, fontSize: 12, fontWeight: 600 };
  if (pct >= 40) return { ...base, background: "#fee2e2", color: "#b91c1c" };
  if (pct >= 25) return { ...base, background: "#fef3c7", color: "#b45309" };
  return { ...base, background: "#f1f5f9", color: "#475569" };
}

const s: Record<string, React.CSSProperties> = {
  brandbar: { background: "linear-gradient(90deg, #0b1220 0%, #12233b 100%)", color: "#fff", padding: "0 1.5rem" },
  brandInner: { maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 },
  brandLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" },
  brandName: { fontSize: 17, fontWeight: 700, lineHeight: 1 },
  brandTag: { fontSize: 12, color: "#94a3b8", marginTop: 3 },
  navBtn: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "9px 16px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" },
  page: { maxWidth: 1120, margin: "0 auto", padding: "1.75rem 1.5rem 3rem" },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 12 },
  h1: { fontSize: 22, margin: 0, letterSpacing: -0.3 },
  sub: { color: "#64748b", margin: "5px 0 0", fontSize: 14 },
  alertPill: { display: "flex", gap: 8, alignItems: "center", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" },
  cardRow: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 22 },
  kpi: { background: "#fff", border: "1px solid #e8edf3", borderRadius: 14, padding: "16px 16px 14px", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" },
  kpiTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  kpiLabel: { fontSize: 11.5, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 },
  kpiIcon: { width: 24, height: 24, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 },
  kpiValue: { fontSize: 23, fontWeight: 700, margin: "0 0 3px", letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" },
  kpiNote: { fontSize: 12, color: "#94a3b8" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 },
  panel: { background: "#fff", border: "1px solid #e8edf3", borderRadius: 14, padding: 20, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" },
  panelHead: { display: "flex", gap: 12, marginBottom: 16 },
  panelAccent: { width: 4, borderRadius: 4, flexShrink: 0 },
  panelTitle: { fontSize: 15.5, margin: 0, fontWeight: 700 },
  panelSub: { fontSize: 12.5, color: "#64748b", margin: "3px 0 0" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { borderBottom: "1px solid #e8edf3", padding: "0 8px 8px", color: "#94a3b8", fontWeight: 600, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.4 },
  td: { borderBottom: "1px solid #f1f5f9", padding: "9px 8px" },
  barLabel: { display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5 },
  barTrack: { background: "#f1f5f9", borderRadius: 6, height: 8, overflow: "hidden" },
  barFill: { background: "linear-gradient(90deg, #f87171, #dc2626)", height: "100%", borderRadius: 6 },
  footer: { marginTop: 26, fontSize: 12, color: "#94a3b8", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 999, background: "#10b981", display: "inline-block" },
};
