"use client";

import { useRef, useState } from "react";
import { parseCsv, rowsToClaims, csvTemplate, type ImportResult } from "@/lib/csv";
import { useClaims } from "./ClaimsProvider";
import { useLang } from "./LanguageProvider";
import type { Lang } from "@/lib/i18n";

const tx = {
  import: { en: "Import data", ar: "استيراد البيانات" },
  title: { en: "Import claims from a file", ar: "استيراد المطالبات من ملف" },
  desc: {
    en: "Export your claims report as CSV (from Excel: Save As → CSV) and drop it here. Columns are matched automatically, English or Arabic.",
    ar: "صدّر تقرير المطالبات كملف CSV (من إكسل: حفظ باسم ← CSV) وأرفقه هنا. تتم مطابقة الأعمدة تلقائياً، بالعربية أو الإنجليزية.",
  },
  choose: { en: "Choose CSV file", ar: "اختر ملف CSV" },
  template: { en: "Download template", ar: "تحميل النموذج" },
  loaded: { en: "claims ready to load", ar: "مطالبة جاهزة للتحميل" },
  matched: { en: "Matched columns", ar: "الأعمدة المطابقة" },
  ignored: { en: "Ignored columns", ar: "أعمدة متجاهلة" },
  load: { en: "Load into dashboard", ar: "تحميل إلى اللوحة" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  reset: { en: "Reset to demo data", ar: "العودة للبيانات التجريبية" },
  usingImported: { en: "Using your imported data", ar: "يتم استخدام بياناتك المستوردة" },
  usingDemo: { en: "Showing demo data", ar: "تُعرض بيانات تجريبية" },
} as const;

function tt(k: keyof typeof tx, l: Lang) {
  return tx[k][l];
}

export function ImportPanel() {
  const { lang } = useLang();
  const { loadClaims, resetToDemo, source } = useClaims();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setPreview(rowsToClaims(parseCsv(text)));
  }

  function confirmLoad() {
    if (preview && preview.claims.length) {
      loadClaims(preview.claims);
      setOpen(false);
      setPreview(null);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([csvTemplate()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "radd-claims-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="radd-btn" style={s.trigger}>
        ⇪ {tt("import", lang)}
      </button>

      {open && (
        <div style={s.overlay} onClick={() => setOpen(false)}>
          <div style={s.modal} dir={lang === "ar" ? "rtl" : "ltr"} onClick={(e) => e.stopPropagation()}>
            <h2 style={s.h2}>{tt("title", lang)}</h2>
            <p style={s.desc}>{tt("desc", lang)}</p>

            <div style={s.actionsRow}>
              <button onClick={() => inputRef.current?.click()} style={s.primary}>
                {tt("choose", lang)}
              </button>
              <button onClick={downloadTemplate} style={s.ghost}>
                ⬇ {tt("template", lang)}
              </button>
              <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={onFile} style={{ display: "none" }} />
            </div>

            {fileName && <p style={s.fileName}>{fileName}</p>}

            {preview && (
              <div style={s.preview}>
                {preview.errors.length > 0 && (
                  <div style={s.errBox}>{preview.errors.join(" ")}</div>
                )}
                <div style={s.count}>
                  <strong style={{ fontSize: 20 }}>{preview.rowCount}</strong> {tt("loaded", lang)}
                </div>
                <div style={s.metaRow}>
                  <span style={s.metaLabel}>{tt("matched", lang)}:</span>
                  {preview.matchedColumns.map((c) => (
                    <span key={c} style={s.tagOk}>{c}</span>
                  ))}
                </div>
                {preview.unmatchedHeaders.length > 0 && (
                  <div style={s.metaRow}>
                    <span style={s.metaLabel}>{tt("ignored", lang)}:</span>
                    {preview.unmatchedHeaders.map((c) => (
                      <span key={c} style={s.tagIgnore}>{c}</span>
                    ))}
                  </div>
                )}
                <button onClick={confirmLoad} disabled={!preview.rowCount} style={s.load}>
                  {tt("load", lang)}
                </button>
              </div>
            )}

            <div style={s.footerRow}>
              <span style={s.status}>
                <span style={{ ...s.dot, background: source === "imported" ? "#10b981" : "#94a3b8" }} />
                {source === "imported" ? tt("usingImported", lang) : tt("usingDemo", lang)}
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                {source === "imported" && (
                  <button onClick={() => { resetToDemo(); setPreview(null); }} style={s.ghost}>
                    {tt("reset", lang)}
                  </button>
                )}
                <button onClick={() => setOpen(false)} style={s.ghost}>
                  {tt("cancel", lang)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  trigger: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "9px 14px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 },
  modal: { background: "#fff", borderRadius: 16, padding: 26, width: "100%", maxWidth: 540, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" },
  h2: { fontSize: 19, margin: "0 0 6px", fontWeight: 700 },
  desc: { fontSize: 13.5, color: "#64748b", lineHeight: 1.55, margin: "0 0 18px" },
  actionsRow: { display: "flex", gap: 10, flexWrap: "wrap" },
  primary: { background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  ghost: { background: "#fff", border: "1px solid #e2e8f0", color: "#334155", padding: "10px 16px", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" },
  fileName: { fontSize: 13, color: "#475569", margin: "12px 0 0", fontFamily: "ui-monospace, monospace" },
  preview: { marginTop: 18, borderTop: "1px solid #f1f5f9", paddingTop: 18 },
  errBox: { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", padding: "10px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 },
  count: { fontSize: 14, color: "#334155", marginBottom: 12 },
  metaRow: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8 },
  metaLabel: { fontSize: 12.5, color: "#64748b", fontWeight: 600 },
  tagOk: { background: "#ecfdf5", color: "#059669", padding: "2px 9px", borderRadius: 999, fontSize: 12, fontWeight: 600 },
  tagIgnore: { background: "#f1f5f9", color: "#94a3b8", padding: "2px 9px", borderRadius: 999, fontSize: 12 },
  load: { marginTop: 8, background: "#0f172a", color: "#fff", border: "none", padding: "11px 20px", borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" },
  footerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9", gap: 12, flexWrap: "wrap" },
  status: { display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "#64748b" },
  dot: { width: 8, height: 8, borderRadius: 999, display: "inline-block" },
};
