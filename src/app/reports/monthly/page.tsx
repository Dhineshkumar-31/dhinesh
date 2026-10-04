"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import ReportTabs from "@/components/reports/ReportTabs";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { formatINR, formatDate } from "@/lib/utils/currency";
import { generateExpensePDF } from "@/lib/pdf/generator";
import { FileDown, Calendar, Receipt, TrendingUp, Layers } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const MONTHS = [
  { value: 1, label: "January (தை)" },
  { value: 2, label: "February (மாசி)" },
  { value: 3, label: "March (பங்குனி)" },
  { value: 4, label: "April (சித்திரை)" },
  { value: 5, label: "May (வைகாசி)" },
  { value: 6, label: "June (ஆனி)" },
  { value: 7, label: "July (ஆடி)" },
  { value: 8, label: "August (ஆவணி)" },
  { value: 9, label: "September (புரட்டாசி)" },
  { value: 10, label: "October (ஐப்பசி)" },
  { value: 11, label: "November (கார்த்திகை)" },
  { value: 12, label: "December (மார்கழி)" },
];

export default function MonthlyReportPage() {
  const { t } = useLanguage();
  const { activeHouse } = useHouse();
  const { success, error } = useToast();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMonthlyReport = useCallback(async () => {
    if (!activeHouse) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?houseId=${activeHouse.id}&year=${year}&month=${month}`);
      const json = await res.json();
      if (json.success) {
        setReport(json.data);
      }
    } catch {
      error("Failed to load monthly report");
    } finally {
      setLoading(false);
    }
  }, [activeHouse, year, month, error]);

  useEffect(() => {
    fetchMonthlyReport();
  }, [fetchMonthlyReport]);

  const handleDownloadPDF = () => {
    if (!report || report.expenses.length === 0) {
      error("No transactions to generate PDF for this month");
      return;
    }

    const monthLabel = MONTHS.find((m) => m.value === month)?.label.split(" ")[0] || month;
    const doc = generateExpensePDF({
      title: "Monthly House Construction Expense Statement",
      reportType: "Monthly Summary",
      dateRange: `${monthLabel} ${year}`,
      house: report.house,
      summary: {
        totalSpent: report.summary.total,
        remainingBudget: Math.max(0, report.house.totalBudget - report.summary.total),
        materialExpense: report.summary.material,
        labourExpense: report.summary.labour,
        otherExpense: report.summary.other,
        transactionCount: report.summary.transactionCount,
      },
      categoryBreakdown: report.categoryBreakdown,
      stageBreakdown: report.stageBreakdown,
      expenses: report.expenses,
    });

    doc.save(`BuildLedger_Monthly_${monthLabel}_${year}.pdf`);
    success("Monthly PDF downloaded successfully");
  };

  const s = report?.summary;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Navigation & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span>{t("reports.monthly")}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Detailed expense statements and itemized transactions for selected month.
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={!report || report.expenses?.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{t("common.downloadPdf")}</span>
          </button>
        </div>

        <ReportTabs />

        {/* Date Selector Row */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {t("reports.selectMonth")}:
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {t("reports.selectYear")}:
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500"
            >
              {[2024, 2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Spent</span>
            <p className="text-xl font-bold text-blue-600 mt-1">{formatINR(s?.total || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Materials</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatINR(s?.material || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Labour</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatINR(s?.labour || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contractor & Other</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatINR((s?.contractor || 0) + (s?.other || 0))}</p>
          </div>
        </div>

        {/* Daily Spending Trend Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>Daily Spending Distribution in {MONTHS.find((m) => m.value === month)?.label.split(" ")[0]} {year}</span>
          </h2>
          <div className="h-60 w-full">
            {report?.dailyTrend && report.dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatINR(val as number), "Spent"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {t("common.noData")}
              </div>
            )}
          </div>
        </div>

        {/* Monthly Expense Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Itemized Expenses ({report?.expenses?.length || 0} Transactions)</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">{t("common.date")}</th>
                  <th className="py-3 px-4">Item / Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Supplier / Worker</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading monthly statement...
                    </td>
                  </tr>
                ) : report?.expenses && report.expenses.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  report.expenses.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(e.expenseDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {e.itemDescription}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap max-w-[130px] truncate">
                        {e.stage}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {e.supplierName || e.workerName || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(e.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-emerald-600 whitespace-nowrap">
                        {formatINR(e.paidAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            e.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700"
                              : e.paymentStatus === "PARTIAL"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {e.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No expenses recorded for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
