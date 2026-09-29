import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MotionPlan — Turn Animation Ideas Into Production-Ready Code",
    template: "%s",
  },
  description:
    "MotionPlan is an AI-powered animation planner for frontend developers. Describe an interaction, get a structured plan, live preview, visual timeline, and production-ready GSAP or CSS code.",
  applicationName: "MotionPlan",
  keywords: [
    "MotionPlan",
    "animation",
    "GSAP",
    "ScrollTrigger",
    "React",
    "Next.js",
    "web animation",
    "AI animation planner",
    "motion design",
  ],
  authors: [{ name: "MotionPlan" }],
  openGraph: {
    type: "website",
    siteName: "MotionPlan",
    title: "MotionPlan — Turn animation ideas into production-ready code",
    description:
      "AI-powered animation planning + live preview + production GSAP code for React and Next.js.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "MotionPlan — Turn animation ideas into production-ready code",
    description:
      "AI-powered animation planning + live preview + production GSAP code for React and Next.js.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full`}>
      <body className="min-h-full bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
