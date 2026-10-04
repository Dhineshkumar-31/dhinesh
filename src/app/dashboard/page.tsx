"use client";

import React, { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { formatINR, formatDate } from "@/lib/utils/currency";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Clock,
  Calendar,
  AlertTriangle,
  PlusCircle,
  ArrowRight,
  Building2,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import Link from "next/link";

interface DashboardData {
  house: {
    id: string;
    name: string;
    ownerName: string;
    location: string;
    totalBudget: number;
  };
  financials: {
    totalBudget: number;
    totalSpent: number;
    remainingBudget: number;
    budgetUsedPercent: number;
    todayExpense: number;
    thisMonthExpense: number;
    thisYearExpense: number;
    materialCost: number;
    labourCost: number;
    otherCost: number;
    pendingPayments: number;
    totalTransactions: number;
    highestCategory: { name: string; value: number } | null;
  };
  categoryBreakdown: Array<{ name: string; value: number }>;
  stageBreakdown: Array<{ name: string; value: number }>;
  monthlyTrend: Array<{ month: string; amount: number }>;
  recentExpenses: Array<{
    id: string;
    expenseDate: string;
    itemDescription: string;
    category: string;
    stage: string;
    expenseType: string;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    supplierName?: string | null;
    workerName?: string | null;
  }>;
}

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#64748b"];

export default function DashboardPage() {
  const { t, locale } = useLanguage();
  const { activeHouse, setShowExpenseModal, setShowCreateHouseModal, houses, loading: houseLoading } = useHouse();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!activeHouse) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?houseId=${activeHouse.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [activeHouse]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // If user has no house projects yet
  if (!houseLoading && houses.length === 0) {
    return (
      <AppShell>
        <div className="py-16 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {locale === "ta" ? "உங்கள் முதல் வீட்டைத் தொடங்குங்கள்" : "Welcome to BuildLedger"}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {locale === "ta"
              ? "கட்டுமான செலவுகளை சரியாக கணக்கிட உங்கள் வீட்டின் விவரங்களை பதிவு செய்யவும்."
              : "Create your first house construction project to start tracking materials, labour, and daily expenses."}
          </p>
          <button
            onClick={() => setShowCreateHouseModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("house.createNew")}</span>
          </button>
        </div>
      </AppShell>
    );
  }

  const f = data?.financials;
  const budgetUsed = f?.budgetUsedPercent || 0;

  // Warning color thresholds
  let progressColor = "bg-blue-600";
  let alertBadge = null;

  if (budgetUsed >= 100) {
    progressColor = "bg-rose-600";
    alertBadge = { text: t("dashboard.budgetExceeded"), color: "bg-rose-50 text-rose-800 border-rose-200" };
  } else if (budgetUsed >= 85) {
    progressColor = "bg-amber-600";
    alertBadge = { text: t("dashboard.budgetWarning85"), color: "bg-amber-50 text-amber-800 border-amber-200" };
  } else if (budgetUsed >= 70) {
    progressColor = "bg-yellow-500";
    alertBadge = { text: t("dashboard.budgetWarning70"), color: "bg-yellow-50 text-yellow-800 border-yellow-200" };
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome Banner & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("dashboard.greeting")} 👋</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {activeHouse?.name || t("common.appName")}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeHouse?.ownerName} • {activeHouse?.location}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("common.quickAdd")}</span>
            </button>
          </div>
        </div>

        {/* Budget Warning Banner if applicable */}
        {alertBadge && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${alertBadge.color}`}>
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{alertBadge.text}</span>
          </div>
        )}

        {/* Primary Financial Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Budget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">{t("dashboard.totalBudget")}</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {formatINR(f?.totalBudget || 0)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>{t("dashboard.budgetUsed")}:</span>
              <span className="font-bold text-slate-800">{budgetUsed.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${progressColor}`}
                style={{ width: `${Math.min(100, budgetUsed)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Total Spent */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">{t("dashboard.totalSpent")}</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              {formatINR(f?.totalSpent || 0)}
            </div>
            <div className="grid grid-cols-2 text-xs pt-2 border-t border-slate-100 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px]">Materials</span>
                <span className="font-semibold text-slate-700">{formatINR(f?.materialCost || 0)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Labour</span>
                <span className="font-semibold text-slate-700">{formatINR(f?.labourCost || 0)}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Remaining Budget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">{t("dashboard.remainingBudget")}</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-2">
              {formatINR(f?.remainingBudget || 0)}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span>Pending Balances:</span>
              <span className="font-semibold text-amber-600">{formatINR(f?.pendingPayments || 0)}</span>
            </div>
          </div>
        </div>

        {/* Time-Based Expense Cards (Today, Month, Year) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{t("dashboard.todayExpense")}</p>
              <p className="text-lg font-bold text-slate-900">{formatINR(f?.todayExpense || 0)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{t("dashboard.thisMonth")}</p>
              <p className="text-lg font-bold text-slate-900">{formatINR(f?.thisMonthExpense || 0)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{t("dashboard.thisYear")}</p>
              <p className="text-lg font-bold text-slate-900">{formatINR(f?.thisYearExpense || 0)}</p>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-w-0">
          {/* Monthly Trend Chart */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>{t("dashboard.expenseTrend")} (Monthly)</span>
              </h2>
            </div>
            <div className="h-64 w-full">
              {data?.monthlyTrend && data.monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyTrend}>
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
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#2563eb" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  {t("common.noData")}
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown (Donut Chart) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs min-w-0 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-600" />
                <span>{t("dashboard.categoryBreakdown")}</span>
              </h2>
              {f?.highestCategory && (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[130px]">
                  Top: {f.highestCategory.name}
                </span>
              )}
            </div>
            <div className="h-64 w-full">
              {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {data.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: unknown) => [formatINR(val as number), "Amount"]}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  {t("common.noData")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Construction Stage Progress Bar Chart */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>{t("dashboard.stageBreakdown")}</span>
            </h2>
            <Link
              href="/stages"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All Stages</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-64 w-full">
            {data?.stageBreakdown && data.stageBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stageBreakdown.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: "#64748b" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatINR(val as number), "Spent"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {t("common.noData")}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>{t("dashboard.recentExpenses")}</span>
            </h2>
            <Link
              href="/expenses"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>{t("common.view")} All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Mobile Card View (< md) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {data?.recentExpenses && data.recentExpenses.length > 0 ? (
              data.recentExpenses.map((e) => (
                <div key={e.id} className="p-4 hover:bg-slate-50 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">
                      {formatDate(e.expenseDate)}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        e.paymentStatus === "PAID"
                          ? "bg-emerald-50 text-emerald-700"
                          : e.paymentStatus === "PARTIAL"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {e.paymentStatus}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{e.itemDescription}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                          {e.category}
                        </span>
                        {(e.supplierName || e.workerName) && (
                          <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                            • {e.supplierName || e.workerName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-slate-900 block">{formatINR(e.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                {t("common.noData")}
              </div>
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">{t("common.date")}</th>
                  <th className="py-3 px-4">Item / Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Vendor / Worker</th>
                  <th className="py-3 px-4 text-right">{t("common.amount")}</th>
                  <th className="py-3 px-4 text-center">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentExpenses && data.recentExpenses.length > 0 ? (
                  data.recentExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(e.expenseDate)}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {e.itemDescription}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {e.supplierName || e.workerName || "-"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(e.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
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
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      {t("common.noData")}
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
