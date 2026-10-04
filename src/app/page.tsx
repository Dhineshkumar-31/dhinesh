"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/context";
import {
  Building2,
  Receipt,
  FileDown,
  HardHat,
  Package,
  Layers,
  ArrowRight,
  CheckCircle2,
  Shield,
  Smartphone,
  Sparkles,
} from "lucide-react";

export default function LandingPage() {
  const { t, locale, setLocale } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-3 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight block leading-tight">
              BuildLedger
            </span>
            <span className="text-[10px] sm:text-[11px] block font-medium text-blue-600 truncate max-w-[170px] sm:max-w-none">
              உங்கள் கட்டுமான செலவுகளை எளிதாக நிர்வகிக்கவும்.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Language Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setLocale("en")}
              className={`px-2 py-1 rounded-md transition ${
                locale === "en" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLocale("ta")}
              className={`px-2 py-1 rounded-md transition ${
                locale === "ta" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              தமிழ்
            </button>
          </div>

          <Link
            href="/login"
            className="px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
          >
            {t("common.login")}
          </Link>
          <Link
            href="/register"
            className="px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition whitespace-nowrap"
          >
            {t("common.register")}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-6 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {locale === "ta"
              ? "உங்கள் கட்டுமான செலவுகளை எளிதாக நிர்வகிக்கவும்."
              : "Build Smarter. Track Every Expense."}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
          {locale === "ta" ? (
            <>
              உங்கள் கட்டுமான செலவுகளை <br className="hidden sm:inline" />
              <span className="text-blue-600">எளிதாக நிர்வகிக்கவும்</span>
            </>
          ) : (
            <>
              Build Smarter. <br className="hidden sm:inline" />
              <span className="text-blue-600">Track Every Expense.</span>
            </>
          )}
        </h1>

        <p className="mt-5 max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
          {locale === "ta"
            ? "டைரி குறிப்புகளைத் தவிர்த்து, சிமெண்ட், கம்பி, செங்கல், கொத்தனார் கூலி, ஆட்கள் சம்பளம் மற்றும் அனைத்து செலவுகளையும் டிஜிட்டலாகப் பதிவு செய்யுங்கள். தினசரி மற்றும் மாதாந்திர PDF அறிக்கைகளை உடனடியாக பதிவிறக்குங்கள்."
            : "Replace messy paper notes and rough diaries with BuildLedger. Track materials, mason wages, contractor payments, and generate printable PDF reports in Indian Rupees."}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 active:scale-95 transition"
          >
            <span>{locale === "ta" ? "இலவசமாக தொடங்குக" : "Start Tracking Now"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm sm:text-base shadow-xs transition"
          >
            {t("common.login")}
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 pt-8 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Materials & Stock</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Labour & Mason Wages</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>19 Construction Stages</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>PDF Reports in ₹ INR</span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="bg-white py-16 border-y border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {locale === "ta" ? "வீட்டுக் கணக்கின் முக்கிய அம்சங்கள்" : "Designed for Home Builders & Contractors"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Everything you need to complete your construction within budget without financial surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Materials */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {locale === "ta" ? "பொருட்கள் மேலாண்மை" : "Material Purchases"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Record Cement bags, Steel rod bundles, Bricks, M-Sand, Jelly, Tiles, Pipes, Electrical wires, and Hardware with supplier contacts and invoice numbers.
              </p>
            </div>

            {/* 2. Labour */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {locale === "ta" ? "கூலி & வேலையாட்கள்" : "Labour & Mason Wages"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automatically calculate daily wages based on head count, daily rates, days worked, and keep exact track of paid advances and balance amounts.
              </p>
            </div>

            {/* 3. Stages */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {locale === "ta" ? "19 கட்டுமான நிலைகள்" : "Construction Stages"}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Organize expenses by milestones: Foundation, Basement, Pillars, Brickwork, Roofing, Plastering, Flooring, Electrical, Plumbing, and Final Finishing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-400 py-10 px-4 sm:px-8 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white">BuildLedger</span>
            <span className="text-slate-500 hidden sm:inline">• உங்கள் கட்டுமான செலவுகளை எளிதாக நிர்வகிக்கவும்.</span>
            <span>© {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white transition">
              {t("common.login")}
            </Link>
            <Link href="/register" className="hover:text-white transition">
              {t("common.register")}
            </Link>
            <Link href="/admin/login" className="hover:text-amber-400 transition">
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
