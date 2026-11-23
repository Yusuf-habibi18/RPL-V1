import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-data", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Agri-Analytics", template: "%s · Agri-Analytics" },
  description: "Platform smart farming: monitoring lahan, peringatan dini, dan rekomendasi budidaya berbasis sensor.",
};

export const viewport: Viewport = {
  themeColor: "#080F1F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${mono.variable}`}>
      <body className="agri-bg min-h-screen font-sans text-fg antialiased">{children}</body>
    </html>
  );
}
