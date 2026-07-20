"use client";

import { useState } from "react";
import type { AppealResult } from "@/lib/types";

export default function Home() {
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
    <main style={{ maxWidth: 780, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>
        Radd <span dir="rtl">رد</span>
      </h1>
      <p>Paste a claim denial letter. Get a reviewed-ready appeal.</p>
      <p>
        <a href="/dashboard" style={{ color: "#0f172a", fontWeight: 600 }}>
          → Open Revenue Command Center
        </a>
      </p>

      <textarea
        value={letterText}
        onChange={(e) => setLetterText(e.target.value)}
        placeholder="Paste the denial letter text here (English or Arabic)..."
        rows={10}
        style={{ width: "100%", padding: 12, fontSize: 14, boxSizing: "border-box" }}
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading || letterText.trim().length < 20}
        style={{ marginTop: 12, padding: "10px 24px", fontSize: 16, cursor: "pointer" }}
      >
        {isLoading ? "Analyzing..." : "Generate appeal"}
      </button>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {result && (
        <section style={{ marginTop: 24 }}>
          <h2>Analysis</h2>
          <ul>
            <li>
              <strong>Denial code:</strong> {result.parsed.denialCode ?? "[not stated]"} —{" "}
              {result.parsed.denialReasonText}
            </li>
            <li>
              <strong>Classification:</strong> {result.classified.classification} (
              {result.classified.appealable ? "appealable" : "fix & resubmit — not an appeal"})
            </li>
            <li>
              <strong>Strategy:</strong> {result.classified.strategy}
            </li>
          </ul>

          {result.letters.map((letter) => (
            <article
              key={letter.language}
              dir={letter.language === "ar" ? "rtl" : "ltr"}
              style={{ background: "#fff", border: "1px solid #ddd", padding: 16, marginTop: 16 }}
            >
              <h3>{letter.subject}</h3>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{letter.body}</pre>
              <h4>{letter.language === "ar" ? "قائمة المرفقات" : "Attachment checklist"}</h4>
              <ul>
                {letter.attachmentChecklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p style={{ fontStyle: "italic", color: "#555" }}>{letter.confidenceNote}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
