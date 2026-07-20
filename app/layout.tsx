import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Radd (رد) — Claims Recovery",
  description: "AI denial appeals for Saudi healthcare providers",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#fafafa" }}>
        {children}
      </body>
    </html>
  );
}
