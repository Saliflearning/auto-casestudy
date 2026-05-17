import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auto-CaseStudy | Agentic Portfolio Studio",
  description:
    "Bring messy artifacts. Get a persona-aware, evidence-backed, editable portfolio ready to publish."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
