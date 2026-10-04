"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { LayoutDashboard, Receipt, Plus, Package, Menu } from "lucide-react";

export default function MobileNav({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { setShowExpenseModal } = useHouse();

  const isMoreActive =
    pathname.startsWith("/contract-expenses") ||
    pathname.startsWith("/labour") ||
    pathname.startsWith("/suppliers") ||
    pathname.startsWith("/stages") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/house") ||
    pathname.startsWith("/profile");

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* 1. Dashboard */}
      <Link
        href="/dashboard"
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
          pathname === "/dashboard" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span>{t("common.dashboard")}</span>
      </Link>

      {/* 2. Expenses */}
      <Link
        href="/expenses"
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
          pathname.startsWith("/expenses") ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <Receipt className="w-5 h-5" />
        <span>{t("common.expenses")}</span>
      </Link>

      {/* 3. Floating Center Action Button (+ Add Expense) */}
      <div className="-mt-6 flex flex-col items-center">
        <button
          onClick={() => setShowExpenseModal(true)}
          className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-95 transition cursor-pointer"
          aria-label="Add Expense"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
        <span className="text-[10px] font-semibold text-blue-600 mt-1">Add</span>
      </div>

      {/* 4. Materials */}
      <Link
        href="/materials"
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition ${
          pathname.startsWith("/materials") ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        <Package className="w-5 h-5" />
        <span>{t("common.materials")}</span>
      </Link>

      {/* 5. More Menu */}
      <button
        onClick={onOpenSidebar}
        className={`flex flex-col items-center gap-1 text-[11px] font-medium transition cursor-pointer ${
          isMoreActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
        }`}
        aria-label="More navigation options"
      >
        <Menu className="w-5 h-5" />
        <span>Menu</span>
      </button>
    </div>
  );
}
