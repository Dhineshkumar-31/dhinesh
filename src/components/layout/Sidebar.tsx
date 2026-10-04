"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import {
  LayoutDashboard,
  Receipt,
  Briefcase,
  Package,
  HardHat,
  Truck,
  Layers,
  FileText,
  Home,
  User,
  PlusCircle,
  ShieldAlert,
  X,
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { t, locale } = useLanguage();
  const { user, setShowExpenseModal, activeHouse } = useHouse();

  const navItems = [
    { label: t("common.dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("common.expenses"), href: "/expenses", icon: Receipt },
    { label: t("common.contractExpenses"), href: "/contract-expenses", icon: Briefcase },
    { label: t("common.materials"), href: "/materials", icon: Package },
    { label: t("common.labour"), href: "/labour", icon: HardHat },
    { label: t("common.suppliers"), href: "/suppliers", icon: Truck },
    { label: t("common.stages"), href: "/stages", icon: Layers },
    { label: t("common.reports"), href: "/reports/monthly", icon: FileText },
    { label: t("common.myHouse"), href: "/house", icon: Home },
    { label: t("common.profile"), href: "/profile", icon: User },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header with close for mobile */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-lg">BuildLedger</span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
              App
            </span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Quick Add Expense Action Button */}
        <div className="p-4">
          <button
            onClick={() => {
              if (onClose) onClose();
              setShowExpenseModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("common.quickAdd")}</span>
          </button>
        </div>

        {/* Active House Badge */}
        {activeHouse && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-xs text-slate-600">
            <Home className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <div className="truncate">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Project</span>
              <span className="font-semibold text-slate-800 truncate block">{activeHouse.name}</span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {user?.role === "ADMIN" && (
            <div className="pt-3 mt-3 border-t border-slate-100">
              <div className="px-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                System Administration
              </div>
              <Link
                href="/admin"
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  pathname.startsWith("/admin")
                    ? "bg-amber-50 text-amber-800 font-semibold"
                    : "text-amber-700 hover:bg-amber-50/60"
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Admin Portal</span>
              </Link>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
          <span>BuildLedger v1.0</span>
          <span>INR (₹)</span>
        </div>
      </aside>
    </>
  );
}
