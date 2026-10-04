"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { Calendar, CalendarDays, CalendarRange, Clock } from "lucide-react";

export default function ReportTabs() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const tabs = [
    { label: t("reports.monthly"), href: "/reports/monthly", icon: Calendar },
    { label: t("reports.daily"), href: "/reports/daily", icon: Clock },
    { label: t("reports.yearly"), href: "/reports/yearly", icon: CalendarDays },
    { label: t("reports.custom"), href: "/reports/custom", icon: CalendarRange },
  ];

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-200/70 rounded-xl w-full sm:w-auto overflow-x-auto text-xs font-semibold">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center justify-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-lg transition whitespace-nowrap shrink-0 flex-1 sm:flex-none ${
              isActive
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
