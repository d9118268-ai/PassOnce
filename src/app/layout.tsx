import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PassOnce | CBT Practice for JAMB, WAEC, NECO, GCE & BECE",
  description:
    "Practice past questions and full CBT mock exams for JAMB, WAEC, NECO, GCE and BECE, with AI-generated questions and instant marking.",
  openGraph: {
    title: "PassOnce",
    description: "CBT practice for JAMB, WAEC, NECO, GCE & BECE.",
    images: ["/og-image.png"],
  },
  themeColor: "#065F46",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}