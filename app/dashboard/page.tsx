import Link from "next/link";
import {
  headlineMetrics,
  payerScorecard,
  denialsByReason,
  upcomingDeadlines,
  underpayments,
  formatSar,
} from "@/lib/metrics";

export const dynamic = "force-static";

export default function Dashboard() {
  const m = headlineMetrics();
  const payers = payerScorecard();
  const reasons = denialsByReason();
  const deadlines = upcomingDeadlines();
  const under = underpayments();

  const maxReasonVal = Math.max(...reasons.map((r) => r.valueSar), 1);

  return (
    <main style={s.page}>
      <header style={s.header}>
        <div>
          <h1 style={s.h1}>
            Radd <span dir="rtl">رد</span> — Revenue Command Center
          </h1>
          <p style={s.sub}>
            Every claim, from denial to recovery. Data reflects the current clinic period.
          </p>
        </div>
        <Link href="/" style={s.navBtn}>
          + New appeal
        </Link>
      </header>

      {/* Headline cards */}
      <section style={s.cardRow}>
        <Kpi label="At risk" value={formatSar(m.atRiskSar)} note="Denied + under appeal" tone="danger" />
        <Kpi label="Recovered" value={formatSar(m.recoveredSar)} note="Won back via appeals" tone="good" />
        <Kpi
          label="Underpaid"
          value={formatSar(m.underpaidSar)}
          note="Paid below contract"
          tone="warn"
        />
        <Kpi label="Denial rate" value={`${m.denialRatePct}%`} note={`${m.totalClaims} claims`} tone="neutral" />
        <Kpi
          label="Appeal win rate"
          value={`${m.recoveryRatePct}%`}
          note="Of resolved appeals"
          tone="good"
        />
      </section>

      <div style={s.grid}>
        {/* Deadlines */}
        <Panel title="Appeal deadlines" subtitle="Miss one and the money is gone for good">
          <table style={s.table}>
            <thead>
              <tr>
                <Th>Claim</Th>
                <Th>Payer</Th>
                <Th right>Amount</Th>
                <Th right>Days left</Th>
              </tr>
            </thead>
            <tbody>
              {deadlines.slice(0, 8).map((d) => (
                <tr key={d.id}>
                  <Td>{d.id}</Td>
                  <Td>{d.payer}</Td>
                  <Td right>{formatSar(d.amountSar)}</Td>
                  <Td right>
                    <span style={deadlineBadge(d.daysLeft)}>
                      {d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d`}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Denial reasons */}
        <Panel title="Why claims are denied" subtitle="Fix the top reason, stop repeat losses">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reasons.slice(0, 7).map((r) => (
              <div key={r.code}>
                <div style={s.barLabel}>
                  <span>
                    <strong>{r.code}</strong> · {r.reason}
                  </span>
                  <span style={{ color: "#64748b" }}>
                    {r.count}× · {formatSar(r.valueSar)}
                  </span>
                </div>
                <div style={s.barTrack}>
                  <div style={{ ...s.barFill, width: `${(r.valueSar / maxReasonVal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Payer scorecard */}
        <Panel title="Payer scorecard" subtitle="Who denies most and underpays most">
          <table style={s.table}>
            <thead>
              <tr>
                <Th>Payer</Th>
                <Th right>Denial %</Th>
                <Th right>At risk</Th>
                <Th right>Underpaid</Th>
              </tr>
            </thead>
            <tbody>
              {payers.map((p) => (
                <tr key={p.payer}>
                  <Td>{p.payer}</Td>
                  <Td right>{p.denialRatePct}%</Td>
                  <Td right>{formatSar(p.atRiskSar)}</Td>
                  <Td right>{formatSar(p.underpaidSar)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        {/* Underpayments */}
        <Panel title="Underpayments" subtitle="Payer paid less than the contracted rate — quiet losses">
          <table style={s.table}>
            <thead>
              <tr>
                <Th>Claim</Th>
                <Th>Payer</Th>
                <Th right>Contracted</Th>
                <Th right>Paid</Th>
                <Th right>Shortfall</Th>
              </tr>
            </thead>
            <tbody>
              {under.slice(0, 8).map((u) => (
                <tr key={u.id}>
                  <Td>{u.id}</Td>
                  <Td>{u.payer}</Td>
                  <Td right>{formatSar(u.contractedSar)}</Td>
                  <Td right>{formatSar(u.paidSar)}</Td>
                  <Td right>
                    <span style={{ color: "#b45309", fontWeight: 600 }}>{formatSar(u.shortfallSar)}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      <footer style={s.footer}>
        Radd runs entirely on local infrastructure — no patient data leaves the Kingdom (PDPL compliant).
        Demo data is synthetic.
      </footer>
    </main>
  );
}

/* ---------- small components ---------- */

function Kpi({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: "good" | "danger" | "warn" | "neutral";
}) {
  const accent = {
    good: "#059669",
    danger: "#dc2626",
    warn: "#b45309",
    neutral: "#334155",
  }[tone];
  return (
    <div style={s.kpi}>
      <div style={s.kpiLabel}>{label}</div>
      <div style={{ ...s.kpiValue, color: accent }}>{value}</div>
      <div style={s.kpiNote}>{note}</div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section style={s.panel}>
      <h2 style={s.panelTitle}>{title}</h2>
      <p style={s.panelSub}>{subtitle}</p>
      {children}
    </section>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th style={{ ...s.th, textAlign: right ? "right" : "left" }}>{children}</th>;
}
function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <td style={{ ...s.td, textAlign: right ? "right" : "left" }}>{children}</td>;
}

function deadlineBadge(daysLeft: number): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
  };
  if (daysLeft < 0) return { ...base, background: "#fee2e2", color: "#b91c1c" };
  if (daysLeft <= 5) return { ...base, background: "#fef3c7", color: "#b45309" };
  return { ...base, background: "#dcfce7", color: "#15803d" };
}

/* ---------- styles ---------- */

const s: Record<string, React.CSSProperties> = {
  page: { maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem", color: "#0f172a" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  h1: { fontSize: 24, margin: 0 },
  sub: { color: "#64748b", margin: "6px 0 0", fontSize: 14 },
  navBtn: {
    background: "#0f172a",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 8,
    textDecoration: "none",
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  cardRow: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 },
  kpi: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 },
  kpiLabel: { fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5 },
  kpiValue: { fontSize: 22, fontWeight: 700, margin: "6px 0 2px" },
  kpiNote: { fontSize: 12, color: "#94a3b8" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  panel: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 18 },
  panelTitle: { fontSize: 16, margin: 0 },
  panelSub: { fontSize: 13, color: "#64748b", margin: "4px 0 14px" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { borderBottom: "1px solid #e2e8f0", padding: "6px 8px", color: "#64748b", fontWeight: 600 },
  td: { borderBottom: "1px solid #f1f5f9", padding: "7px 8px" },
  barLabel: { display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 },
  barTrack: { background: "#f1f5f9", borderRadius: 6, height: 8, overflow: "hidden" },
  barFill: { background: "#dc2626", height: "100%", borderRadius: 6 },
  footer: { marginTop: 24, fontSize: 12, color: "#94a3b8", textAlign: "center" },
};
