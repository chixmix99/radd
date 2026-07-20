import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LanguageProvider } from "./LanguageProvider";

export const metadata: Metadata = {
  title: "Radd (رد) — Claims Recovery",
  description: "AI claims-recovery system for Saudi healthcare providers",
};

const globalCss = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #0f172a;
    background: #f6f8fb;
    -webkit-font-smoothing: antialiased;
  }
  a { color: inherit; }
  table tbody tr { transition: background 0.12s ease; }
  table tbody tr:hover { background: #f8fafc; }
  .radd-kpi { transition: transform 0.12s ease, box-shadow 0.12s ease; }
  .radd-kpi:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(15,23,42,0.08); }
  .radd-panel { transition: box-shadow 0.12s ease; }
  .radd-panel:hover { box-shadow: 0 6px 20px rgba(15,23,42,0.06); }
  .radd-btn:hover { opacity: 0.9; }
  @media (max-width: 900px) {
    .radd-kpirow { grid-template-columns: repeat(2, 1fr) !important; }
    .radd-grid { grid-template-columns: 1fr !important; }
  }
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: globalCss }} />
      </head>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
