"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { formatINR, formatDate } from "@/lib/utils/currency";
import { exportExpensesToCSV } from "@/lib/utils/csv";
import ExpenseModal from "@/components/expenses/ExpenseModal";
import {
  Receipt,
  Search,
  Filter,
  Download,
  PlusCircle,
  Edit2,
  Trash2,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";

interface ExpenseItem {
  id: string;
  expenseDate: string;
  expenseType: string;
  category: string;
  stage: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  supplierName?: string | null;
  workerName?: string | null;
  contractorName?: string | null;
  phoneNumber?: string | null;
  paymentMethod: string;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  receiptUrl?: string | null;
  notes?: string | null;
}

export default function ExpensesPage() {
  const { t } = useLanguage();
  const { activeHouse, setShowExpenseModal } = useHouse();
  const { success, error } = useToast();

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ totalAmount: 0, paidAmount: 0, balanceAmount: 0 });

  // Filters & State
  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("expenseDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // Edit Expense State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingExpense, setEditingExpense] = useState<any>(null);

  const fetchExpenses = useCallback(async () => {
    if (!activeHouse) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        houseId: activeHouse.id,
        search,
        type,
        paymentStatus,
        sortBy,
        sortOrder,
        page: page.toString(),
        limit: "15",
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data);
        setTotalRecords(json.pagination.totalRecords);
        setTotalPages(json.pagination.totalPages);
        setSummary(json.summary);
      }
    } catch {
      error("Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  }, [activeHouse, search, type, paymentStatus, startDate, endDate, sortBy, sortOrder, page, error]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm(t("common.confirmDelete"))) return;

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        success("Expense deleted successfully");
        fetchExpenses();
      } else {
        error(json.message || "Failed to delete expense");
      }
    } catch {
      error("Network error");
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      error("No expense records to export");
      return;
    }
    exportExpensesToCSV(expenses, `buildledger_${activeHouse?.name || "house"}_expenses.csv`);
    success("Expenses exported as CSV");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-blue-600" />
              <span>{t("expenses.title")}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {totalRecords} records recorded • Total Filtered: <span className="font-bold text-slate-800">{formatINR(summary.totalAmount)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-medium text-xs sm:text-sm shadow-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>{t("common.exportCsv")}</span>
            </button>

            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t("common.quickAdd")}</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search description, supplier..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Types</option>
                <option value="MATERIAL">Material</option>
                <option value="LABOUR">Labour</option>
                <option value="CONTRACTOR">Contractor</option>
                <option value="TRANSPORTATION">Transportation</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="SERVICE">Service</option>
                <option value="MISCELLANEOUS">Miscellaneous</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <select
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PAID">Fully Paid</option>
                <option value="PARTIAL">Partially Paid</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, ord] = e.target.value.split("-");
                  setSortBy(by);
                  setSortOrder(ord as "asc" | "desc");
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="expenseDate-desc">Date (Newest First)</option>
                <option value="expenseDate-asc">Date (Oldest First)</option>
                <option value="amount-desc">Amount (Highest First)</option>
                <option value="amount-asc">Amount (Lowest First)</option>
              </select>
            </div>
          </div>

          {/* Date range filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs"
            />
            {(startDate || endDate || search || type !== "ALL" || paymentStatus !== "ALL") && (
              <button
                onClick={() => {
                  setSearch("");
                  setType("ALL");
                  setPaymentStatus("ALL");
                  setStartDate("");
                  setEndDate("");
                  setPage(1);
                }}
                className="text-xs font-semibold text-blue-600 hover:underline ml-auto"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Expenses Data List / Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Mobile Card View (< md) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading expenses...
              </div>
            ) : expenses.length > 0 ? (
              expenses.map((e) => (
                <div key={e.id} className="p-4 hover:bg-slate-50/70 transition space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {formatDate(e.expenseDate)}
                    </span>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
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

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{e.itemDescription}</h3>
                    {e.quantity > 0 && e.unitPrice > 0 && (
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {e.quantity} {e.unit} @ ₹{e.unitPrice}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                      {e.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium truncate max-w-[150px]">
                      {e.stage}
                    </span>
                    {(e.supplierName || e.workerName || e.contractorName) && (
                      <span className="text-slate-500 truncate max-w-[140px]">
                        • {e.supplierName || e.workerName || e.contractorName}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">
                        Total: <span className="font-bold text-slate-900 text-sm">{formatINR(e.totalAmount)}</span>
                      </div>
                      <div className="text-[11px] text-emerald-600">
                        Paid: {formatINR(e.paidAmount)}
                        {e.balanceAmount > 0 && (
                          <span className="text-rose-500 font-medium ml-1.5">
                            (Bal: {formatINR(e.balanceAmount)})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {e.receiptUrl && (
                        <a
                          href={e.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="View Receipt"
                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          <FileCheck className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => setEditingExpense(e)}
                        title="Edit"
                        className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(e.id)}
                        title="Delete"
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                {t("common.noData")}
              </div>
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">{t("common.date")}</th>
                  <th className="py-3.5 px-4">Item / Description</th>
                  <th className="py-3.5 px-4">Type & Category</th>
                  <th className="py-3.5 px-4">Stage</th>
                  <th className="py-3.5 px-4">Vendor / Worker</th>
                  <th className="py-3.5 px-4 text-right">{t("common.total")}</th>
                  <th className="py-3.5 px-4 text-right">{t("common.paid")}</th>
                  <th className="py-3.5 px-4 text-center">{t("common.status")}</th>
                  <th className="py-3.5 px-4 text-center">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Loading expenses...
                    </td>
                  </tr>
                ) : expenses.length > 0 ? (
                  expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(e.expenseDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{e.itemDescription}</div>
                        {e.quantity > 0 && e.unitPrice > 0 && (
                          <div className="text-[11px] text-slate-400">
                            {e.quantity} {e.unit} @ ₹{e.unitPrice}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700 block">{e.category}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{e.expenseType}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap max-w-[140px] truncate">
                        {e.stage}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {e.supplierName || e.workerName || e.contractorName || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(e.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-emerald-600 whitespace-nowrap">
                        {formatINR(e.paidAmount)}
                        {e.balanceAmount > 0 && (
                          <span className="block text-[10px] text-rose-500 font-normal">
                            Bal: {formatINR(e.balanceAmount)}
                          </span>
                        )}
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
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {e.receiptUrl && (
                            <a
                              href={e.receiptUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="View Receipt"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                            >
                              <FileCheck className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setEditingExpense(e)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            title="Delete"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      {t("common.noData")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {page} of {totalPages} ({totalRecords} items)
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Expense Modal Instance */}
      {editingExpense && (
        <ExpenseModal
          editingExpense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onSuccess={() => {
            setEditingExpense(null);
            fetchExpenses();
          }}
        />
      )}
    </AppShell>
  );
}
