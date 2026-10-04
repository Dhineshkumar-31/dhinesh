"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import ReportTabs from "@/components/reports/ReportTabs";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { formatINR } from "@/lib/utils/currency";
import { generateExpensePDF } from "@/lib/pdf/generator";
import { FileDown, CalendarDays, TrendingUp, Layers, Award } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function YearlyReportPage() {
  const { t } = useLanguage();
  const { activeHouse } = useHouse();
  const { success, error } = useToast();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchYearlyReport = useCallback(async () => {
    if (!activeHouse) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/yearly?houseId=${activeHouse.id}&year=${year}`);
      const json = await res.json();
      if (json.success) {
        setReport(json.data);
      }
    } catch {
      error("Failed to load yearly report");
    } finally {
      setLoading(false);
    }
  }, [activeHouse, year, error]);

  useEffect(() => {
    fetchYearlyReport();
  }, [fetchYearlyReport]);

  const handleDownloadPDF = () => {
    if (!report || report.monthlyBreakdown?.length === 0) {
      error("No data available for this year");
      return;
    }

    const doc = generateExpensePDF({
      title: "Annual House Construction Financial Statement",
      reportType: "Yearly Audit Summary",
      dateRange: `Calendar Year ${year}`,
      house: report.house,
      summary: {
        totalSpent: report.financials.totalYearlySpent,
        remainingBudget: report.financials.remainingBudget,
        transactionCount: report.financials.transactionCount,
      },
      categoryBreakdown: report.categoryBreakdown,
      stageBreakdown: report.stageBreakdown,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expenses: report.monthlyBreakdown.map((m: any) => ({
        expenseDate: new Date(year, 0, 1),
        itemDescription: `Cumulative Expenses for ${m.month} ${year}`,
        category: "Monthly Total",
        stage: "All Stages",
        expenseType: "SUMMARY",
        quantity: 1,
        unit: "Month",
        unitPrice: m.amount,
        totalAmount: m.amount,
        paidAmount: m.amount,
        balanceAmount: 0,
        paymentStatus: "PAID",
        paymentMethod: "COMBINED",
      })),
    });

    doc.save(`BuildLedger_Annual_Report_${year}.pdf`);
    success("Yearly PDF downloaded successfully");
  };

  const f = report?.financials;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-blue-600" />
              <span>{t("reports.yearly")}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Annual consolidated spending and construction progress breakdown.
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={!report}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Annual PDF</span>
          </button>
        </div>

        <ReportTabs />

        {/* Year Selector */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {t("reports.selectYear")}:
          </label>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-500"
          >
            {[2023, 2024, 2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
        </div>

        {/* Annual Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Spent ({year})</span>
            <p className="text-xl font-bold text-blue-600 mt-1">{formatINR(f?.totalYearlySpent || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Budget</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatINR(f?.totalBudget || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Remaining Budget</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{formatINR(f?.remainingBudget || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Peak Month</span>
            <p className="text-base font-bold text-slate-900 mt-1">
              {f?.highestMonth?.month || "-"} ({formatINR(f?.highestMonth?.amount || 0)})
            </p>
          </div>
        </div>

        {/* 12-Month Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Monthly Expenditure Chart ({year})</span>
          </h2>
          <div className="h-64 w-full">
            {report?.monthlyBreakdown && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatINR(val as number), "Spent"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Categories and Stages Annual Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Annual Category Distribution</h2>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {report?.categoryBreakdown?.map((c: any) => (
                <div key={c.name} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{c.name}</span>
                  <span className="font-bold text-slate-900">{formatINR(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stage Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Annual Milestone Progress</h2>
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {report?.stageBreakdown?.map((st: any) => (
                <div key={st.name} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{st.name}</span>
                  <span className="font-bold text-slate-900">{formatINR(st.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
