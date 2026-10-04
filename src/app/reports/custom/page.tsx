"use client";

import React, { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import ReportTabs from "@/components/reports/ReportTabs";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { formatINR, formatDate, toInputDateFormat } from "@/lib/utils/currency";
import { generateExpensePDF } from "@/lib/pdf/generator";
import { FileDown, CalendarRange, Filter, Receipt } from "lucide-react";

export default function CustomReportPage() {
  const { t } = useLanguage();
  const { activeHouse } = useHouse();
  const { success, error } = useToast();

  const [from, setFrom] = useState(toInputDateFormat(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(toInputDateFormat(new Date()));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeHouse) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/reports/custom?houseId=${activeHouse.id}&from=${from}&to=${to}`);
      const json = await res.json();
      if (json.success) {
        setReport(json.data);
      } else {
        error(json.message || "Failed to generate report");
      }
    } catch {
      error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!report || report.expenses?.length === 0) {
      error("No transactions to generate PDF for this date range");
      return;
    }

    const doc = generateExpensePDF({
      title: "Custom Range House Construction Expense Statement",
      reportType: "Custom Date Range",
      dateRange: `${formatDate(from)} to ${formatDate(to)}`,
      house: report.house,
      summary: {
        totalSpent: report.summary.totalAmount,
        remainingBudget: Math.max(0, report.house.totalBudget - report.summary.totalAmount),
        transactionCount: report.summary.transactionCount,
      },
      categoryBreakdown: report.categoryBreakdown,
      stageBreakdown: report.stageBreakdown,
      expenses: report.expenses,
    });

    doc.save(`BuildLedger_Custom_${from}_to_${to}.pdf`);
    success("Custom PDF downloaded successfully");
  };

  const s = report?.summary;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarRange className="w-6 h-6 text-blue-600" />
              <span>{t("reports.custom")}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Generate custom date range statements for bank audits, contractor settlements, or tax records.
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={!report || report.expenses?.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Custom PDF</span>
          </button>
        </div>

        <ReportTabs />

        {/* Date Selector Form */}
        <form
          onSubmit={handleGenerate}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3"
        >
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {t("reports.fromDate")}:
            </label>
            <input
              type="date"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              {t("reports.toDate")}:
            </label>
            <input
              type="date"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition"
          >
            {loading ? "Generating..." : t("reports.generateReport")}
          </button>
        </form>

        {report && (
          <>
            {/* Financial Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total In Range</span>
                <p className="text-xl font-bold text-blue-600 mt-1">{formatINR(s?.totalAmount || 0)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Paid</span>
                <p className="text-xl font-bold text-emerald-600 mt-1">{formatINR(s?.paidAmount || 0)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Balance</span>
                <p className="text-xl font-bold text-rose-600 mt-1">{formatINR(s?.balanceAmount || 0)}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transactions</span>
                <p className="text-xl font-bold text-slate-800 mt-1">{s?.transactionCount || 0}</p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-blue-600" />
                  <span>
                    Transactions from {formatDate(from)} to {formatDate(to)}
                  </span>
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Item / Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Stage</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.expenses.length > 0 ? (
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
                          <td className="py-3.5 px-4 text-slate-600">{e.stage}</td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                            {formatINR(e.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
                            {formatINR(e.paidAmount)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                              {e.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          No transactions found in this date range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
