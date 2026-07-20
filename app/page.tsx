"use client";

import { useState } from "react";
import Link from "next/link";
import type { AppealResult } from "@/lib/types";
import { t } from "@/lib/i18n";
import { useLang, LangToggle } from "./LanguageProvider";

export default function Home() {
  const { lang, dir } = useLang();
  const [letterText, setLetterText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AppealResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/appeal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letterText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data as AppealResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

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
            <Link href="/dashboard" className="radd-btn" style={s.navBtn}>
              {t("openDashboard", lang)}
            </Link>
          </div>
        </div>
      </div>

      <main style={s.page}>
        <h1 style={s.h1}>{t("appealTitle", lang)}</h1>
        <p style={s.sub}>{t("appealSub", lang)}</p>

        <div style={s.card}>
          <textarea
            value={letterText}
            onChange={(e) => setLetterText(e.target.value)}
            placeholder={t("placeholder", lang)}
            rows={9}
            style={s.textarea}
          />
          <div style={s.actions}>
            <span style={s.hint}>{t("localHint", lang)}</span>
            <button
              onClick={handleSubmit}
              disabled={isLoading || letterText.trim().length < 20}
              className="radd-btn"
              style={{
                ...s.submit,
                opacity: isLoading || letterText.trim().length < 20 ? 0.5 : 1,
                cursor: isLoading || letterText.trim().length < 20 ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? t("analyzing", lang) : t("generate", lang)}
            </button>
          </div>
        </div>

        {error && <p style={s.error}>{error}</p>}

        {result && (
          <section style={{ marginTop: 24 }}>
            <div style={s.analysis}>
              <h2 style={s.analysisH}>{t("analysis", lang)}</h2>
              <div style={s.analysisRow}>
                <span style={s.chip}>{result.parsed.denialCode ?? t("noCode", lang)}</span>
                <span style={s.chip}>{result.classified.classification}</span>
                <span style={{ ...s.chip, background: result.classified.appealable ? "#dcfce7" : "#f1f5f9", color: result.classified.appealable ? "#15803d" : "#475569" }}>
                  {result.classified.appealable ? t("appealable", lang) : t("fixResubmit", lang)}
                </span>
              </div>
              <p style={s.strategy}>
                <strong>{t("strategy", lang)}:</strong> {result.classified.strategy}
              </p>
            </div>

            {result.letters.map((letter) => (
              <article key={letter.language} dir={letter.language === "ar" ? "rtl" : "ltr"} style={s.letter}>
                <div style={s.letterHead}>
                  <h3 style={s.letterSubject}>{letter.subject}</h3>
                  <span style={s.langTag}>{letter.language === "ar" ? "العربية" : "English"}</span>
                </div>
                <pre style={s.letterBody}>{letter.body}</pre>
                <div style={s.checklist}>
                  <h4 style={s.checklistH}>{letter.language === "ar" ? "قائمة المرفقات" : "Attachment checklist"}</h4>
                  <ul style={{ margin: "6px 0 0", paddingInlineStart: 20 }}>
                    {letter.attachmentChecklist.map((item) => (
                      <li key={item} style={{ marginBottom: 3 }}>{item}</li>
                    ))}
                  </ul>
                </div>
                <p style={s.confidence}>{letter.confidenceNote}</p>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  brandbar: { background: "linear-gradient(90deg, #0b1220 0%, #12233b 100%)", color: "#fff", padding: "0 1.5rem" },
  brandInner: { maxWidth: 820, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 },
  brandLeft: { display: "flex", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 },
  brandName: { fontSize: 17, fontWeight: 700, lineHeight: 1 },
  brandTag: { fontSize: 12, color: "#94a3b8", marginTop: 3 },
  navBtn: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "9px 16px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 },
  page: { maxWidth: 820, margin: "0 auto", padding: "2rem 1.5rem 3rem" },
  h1: { fontSize: 24, margin: 0, letterSpacing: -0.4 },
  sub: { color: "#64748b", fontSize: 14.5, lineHeight: 1.55, margin: "8px 0 22px", maxWidth: 640 },
  card: { background: "#fff", border: "1px solid #e8edf3", borderRadius: 14, padding: 16, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" },
  textarea: { width: "100%", padding: 14, fontSize: 14, lineHeight: 1.5, border: "1px solid #e2e8f0", borderRadius: 10, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", outline: "none" },
  actions: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  hint: { fontSize: 12, color: "#94a3b8" },
  submit: { background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", padding: "11px 22px", fontSize: 15, fontWeight: 600, borderRadius: 9 },
  error: { color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", borderRadius: 9, marginTop: 16, fontSize: 14 },
  analysis: { background: "#fff", border: "1px solid #e8edf3", borderRadius: 14, padding: 18, marginBottom: 16 },
  analysisH: { fontSize: 15, margin: "0 0 12px", fontWeight: 700 },
  analysisRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 },
  chip: { background: "#eef2ff", color: "#4338ca", padding: "4px 11px", borderRadius: 999, fontSize: 12.5, fontWeight: 600 },
  strategy: { fontSize: 13.5, color: "#334155", lineHeight: 1.55, margin: 0 },
  letter: { background: "#fff", border: "1px solid #e8edf3", borderRadius: 14, padding: 22, marginTop: 16, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" },
  letterHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 },
  letterSubject: { fontSize: 16, margin: 0, fontWeight: 700, lineHeight: 1.4 },
  langTag: { background: "#f1f5f9", color: "#475569", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  letterBody: { whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 14, lineHeight: 1.6, color: "#1e293b", margin: 0 },
  checklist: { background: "#f8fafc", borderRadius: 10, padding: "12px 14px", marginTop: 16 },
  checklistH: { fontSize: 13, margin: 0, fontWeight: 700, color: "#334155" },
  confidence: { fontStyle: "italic", color: "#64748b", fontSize: 13, lineHeight: 1.5, marginTop: 14, marginBottom: 0 },
};
