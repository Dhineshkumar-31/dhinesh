import type { Metadata } from "next";
import "./globals.css";
import AppProviders from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "BuildLedger — Build Smarter. Track Every Expense.",
  description:
    "BuildLedger — Build Smarter. Track Every Expense. உங்கள் கட்டுமான செலவுகளை எளிதாக நிர்வகிக்கவும். Complete construction expense, materials, labour, and budget management SaaS.",
  keywords: [
    "BuildLedger",
    "house construction expense manager",
    "construction budget tracker",
    "home building expense app",
    "civil contractor finance",
    "கட்டுமான செலவு",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
