import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TutorScreen AI — Cuemath Tutor Screening",
  description: "AI-powered voice interview platform for tutor candidates",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
