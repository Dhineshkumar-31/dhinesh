"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import ReportTabs from "@/components/reports/ReportTabs";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { formatINR, formatDate, toInputDateFormat } from "@/lib/utils/currency";
import { generateExpensePDF } from "@/lib/pdf/generator";
import { FileDown, Clock, Receipt } from "lucide-react";

export default function DailyReportPage() {
  const { t } = useLanguage();
  const { activeHouse } = useHouse();
  const { success, error } = useToast();

  const [dateStr, setDateStr] = useState(toInputDateFormat(new Date()));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDailyReport = useCallback(async () => {
    if (!activeHouse) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/daily?houseId=${activeHouse.id}&date=${dateStr}`);
      const json = await res.json();
      if (json.success) {
        setReport(json.data);
      }
    } catch {
      error("Failed to load daily report");
    } finally {
      setLoading(false);
    }
  }, [activeHouse, dateStr, error]);

  useEffect(() => {
    fetchDailyReport();
  }, [fetchDailyReport]);

  const handleDownloadPDF = () => {
    if (!report || report.expenses?.length === 0) {
      error("No transactions to generate PDF for this date");
      return;
    }

    const doc = generateExpensePDF({
      title: "Daily House Construction Expense Statement",
      reportType: "Daily Summary",
      dateRange: formatDate(dateStr),
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
      expenses: report.expenses,
    });

    doc.save(`BuildLedger_Daily_${dateStr}.pdf`);
    success("Daily PDF downloaded successfully");
  };

  const s = report?.summary;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-blue-600" />
              <span>{t("reports.daily")}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Itemized ledger statement for selected construction date.
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={!report || report.expenses?.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Daily PDF</span>
          </button>
        </div>

        <ReportTabs />

        {/* Date Selector */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {t("reports.selectDate")}:
          </label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Day Expense</span>
            <p className="text-xl font-bold text-blue-600 mt-1">{formatINR(s?.total || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Material Cost</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatINR(s?.material || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Labour Wages</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatINR(s?.labour || 0)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transactions Count</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{s?.transactionCount || 0}</p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>Daily Transactions ({formatDate(dateStr)})</span>
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Item / Description</th>
                  <th className="py-3 px-4">Type & Category</th>
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
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading daily statement...
                    </td>
                  </tr>
                ) : report?.expenses && report.expenses.length > 0 ? (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  report.expenses.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {e.itemDescription}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 block">{e.category}</span>
                        <span className="text-[10px] text-slate-400">{e.expenseType}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{e.stage}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {e.supplierName || e.workerName || "-"}
                      </td>
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
                      No expenses recorded on {formatDate(dateStr)}.
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
