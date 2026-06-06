import type { Metadata } from "next";
import {
  Inter,
  JetBrains_Mono,
  Noto_Sans_JP,
  Noto_Serif_JP,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jb-mono",
  display: "swap",
});

const notoJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-jp",
  display: "swap",
  weight: ["300", "400", "500", "700"],
});

const notoSerifJP = Noto_Serif_JP({
  subsets: ["latin"],
  variable: "--font-noto-serif-jp",
  display: "swap",
  weight: ["200", "400"],
});

export const metadata: Metadata = {
  title: "EdgePro — Offline 介護 申し送り Copilot",
  description:
    "Air-gapped Japanese nursing handover assistant. Powered by LFM2.5-Audio-1.5B-JP on AMD Ryzen AI. No cloud — no PII ever leaves the device.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${jbMono.variable} ${notoJP.variable} ${notoSerifJP.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
