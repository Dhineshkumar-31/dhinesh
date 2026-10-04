"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { formatINR, formatDate, toInputDateFormat } from "@/lib/utils/currency";
import {
  Briefcase,
  PlusCircle,
  Search,
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  X,
  Phone,
  Layers,
  Calendar,
  AlertCircle,
} from "lucide-react";
import SelectWithAddValue from "@/components/ui/SelectWithAddValue";

interface ContractExpenseItem {
  id: string;
  contractorName: string;
  phoneNumber?: string | null;
  itemDescription: string;
  category: string;
  stage: string;
  expenseDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  notes?: string | null;
}

interface ContractSummary {
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  contractorCount: number;
  recordsCount: number;
}

const CONTRACT_CATEGORIES = [
  "Contract / Kothanar (கொத்தனார் / ஒப்பந்தம்)",
  "Civil & Masonry Contract (சிவில் மேஸ்திரி ஒப்பந்தம்)",
  "Centering & RCC Slab Work (சென்டரிங் & கான்கிரீட்)",
  "Carpentry & Woodwork (தச்சு வேலை ஒப்பந்தம்)",
  "Electrical & Plumbing (மின்சாரம் & பிளம்பிங்)",
  "Painting & Finishing (வண்ணம் பூசுதல் ஒப்பந்தம்)",
  "Tile & Granite Laying (டைல்ஸ் & கிரானைட்)",
  "Iron & Steel Fabrication (இரும்பு & கிரில் வேலை)",
  "False Ceiling & POP (ஃபால்ஸ் சீலிங்)",
  "General Contractor (பொது ஒப்பந்ததாரர்)",
];

const CONSTRUCTION_STAGES = [
  "Foundation (அடித்தளம்)",
  "Plinth & Beam (பேஸ்மென்ட்)",
  "Structure / Framing (தூண்கள் & சட்டகம்)",
  "Brickwork / Masonry (செங்கல் கட்டுதல்)",
  "Centering & Roof Slab (ரூஃப் ஸ்லாப்)",
  "Plastering (பூச்சு வேலை)",
  "Plumbing & Electrical (குழாய் & மின்சாரம்)",
  "Flooring & Tiling (டைல்ஸ் வேலை)",
  "Painting (வண்ணம் பூசுதல்)",
  "Doors & Windows (கதவு, ஜன்னல்கள்)",
  "Finishing & Handover (முழுமை வேலைகள்)",
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash (பணம்)" },
  { value: "UPI", label: "UPI (GPay / PhonePe / Paytm)" },
  { value: "BANK_TRANSFER", label: "Bank Transfer (NEFT / IMPS)" },
  { value: "CHEQUE", label: "Cheque (காசோலை)" },
  { value: "OTHER", label: "Other (இதர)" },
];

export default function ContractExpensesPage() {
  const { t, locale } = useLanguage();
  const { activeHouse } = useHouse();
  const { success, error } = useToast();

  const [entries, setEntries] = useState<ContractExpenseItem[]>([]);
  const [summary, setSummary] = useState<ContractSummary>({
    totalAmount: 0,
    paidAmount: 0,
    balanceAmount: 0,
    contractorCount: 0,
    recordsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ContractExpenseItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    contractorName: "",
    phoneNumber: "",
    itemDescription: "",
    category: "Contract / Kothanar (கொத்தனார் / ஒப்பந்தம்)",
    stage: "Structure / Framing (தூண்கள் & சட்டகம்)",
    expenseDate: toInputDateFormat(new Date()),
    totalAmount: "",
    paidAmount: "",
    paymentMethod: "CASH",
    notes: "",
  });

  const fetchContractExpenses = useCallback(async () => {
    if (!activeHouse) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/contract-expenses?houseId=${activeHouse.id}`);
      const json = await res.json();
      if (json.success) {
        setEntries(json.data.entries || []);
        setSummary(json.data.summary || {
          totalAmount: 0,
          paidAmount: 0,
          balanceAmount: 0,
          contractorCount: 0,
          recordsCount: 0,
        });
      } else {
        error(json.message || "Failed to load contract expenses");
      }
    } catch {
      error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [activeHouse, error]);

  useEffect(() => {
    fetchContractExpenses();
  }, [fetchContractExpenses]);

  const resetForm = () => {
    setFormData({
      contractorName: "",
      phoneNumber: "",
      itemDescription: "",
      category: "Contract / Kothanar (கொத்தனார் / ஒப்பந்தம்)",
      stage: "Structure / Framing (தூண்கள் & சட்டகம்)",
      expenseDate: toInputDateFormat(new Date()),
      totalAmount: "",
      paidAmount: "",
      paymentMethod: "CASH",
      notes: "",
    });
    setEditingEntry(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (item: ContractExpenseItem) => {
    setEditingEntry(item);
    setFormData({
      contractorName: item.contractorName || "",
      phoneNumber: item.phoneNumber || "",
      itemDescription: item.itemDescription || "",
      category: item.category || "Contract / Kothanar (கொத்தனார் / ஒப்பந்தம்)",
      stage: item.stage || "Structure / Framing (தூண்கள் & சட்டகம்)",
      expenseDate: toInputDateFormat(new Date(item.expenseDate)),
      totalAmount: item.totalAmount ? String(item.totalAmount) : "",
      paidAmount: item.paidAmount !== undefined ? String(item.paidAmount) : "",
      paymentMethod: item.paymentMethod || "CASH",
      notes: item.notes || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHouse) return;

    if (!formData.contractorName.trim()) {
      error("Contractor / Kothanar name is required");
      return;
    }

    if (!formData.itemDescription.trim()) {
      error("Work description / scope is required");
      return;
    }

    const total = parseFloat(formData.totalAmount);
    if (isNaN(total) || total <= 0) {
      error("Please enter a valid Total Amount greater than 0");
      return;
    }

    setActionLoading(true);
    try {
      if (editingEntry) {
        // Edit existing
        const res = await fetch(`/api/contract-expenses/${editingEntry.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            totalAmount: total,
            paidAmount: formData.paidAmount !== "" ? parseFloat(formData.paidAmount) : total,
          }),
        });
        const json = await res.json();
        if (json.success) {
          success("Contract expense updated successfully");
          resetForm();
          fetchContractExpenses();
        } else {
          error(json.message || "Failed to update record");
        }
      } else {
        // Create new
        const res = await fetch("/api/contract-expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            houseId: activeHouse.id,
            totalAmount: total,
            paidAmount: formData.paidAmount !== "" ? parseFloat(formData.paidAmount) : total,
          }),
        });
        const json = await res.json();
        if (json.success) {
          success("Contract expense added successfully");
          setShowAddModal(false);
          resetForm();
          fetchContractExpenses();
        } else {
          error(json.message || "Failed to save contract expense");
        }
      }
    } catch {
      error("Network error while saving contract expense");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/contract-expenses/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        success("Contract expense deleted successfully");
        setDeletingId(null);
        fetchContractExpenses();
      } else {
        error(json.message || "Failed to delete record");
      }
    } catch {
      error("Network error while deleting");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter logic
  const filtered = entries.filter((item) => {
    const q = (search || "").toLowerCase().trim();
    const contractor = (item.contractorName || item.itemDescription || "Contractor").toLowerCase();
    const desc = (item.itemDescription || "").toLowerCase();
    const phone = (item.phoneNumber || "").toLowerCase();
    const stage = (item.stage || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();
    const notes = (item.notes || "").toLowerCase();

    const matchesSearch =
      !q ||
      contractor.includes(q) ||
      desc.includes(q) ||
      phone.includes(q) ||
      stage.includes(q) ||
      cat.includes(q) ||
      notes.includes(q);

    const matchesStage = stageFilter === "ALL" || item.stage === stageFilter;
    const matchesStatus = statusFilter === "ALL" || item.paymentStatus === statusFilter;

    return matchesSearch && matchesStage && matchesStatus;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-blue-600" />
              <span>{locale === "ta" ? "ஒப்பந்த செலவுகள் (Contract Expenses)" : "Contract Expenses"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {locale === "ta"
                ? "கொத்தனார் மற்றும் ஒப்பந்ததாரர்களுக்கு வழங்கிய கட்டணங்களை கண்காணிக்கவும்."
                : "Track work agreements, milestones, and payments given to contractors / Kothanar."}
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{locale === "ta" ? "+ ஒப்பந்த செலவு சேர்க்க" : "+ Add Contract Expense"}</span>
          </button>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Contract Amount Spent */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
                {locale === "ta" ? "மொத்த ஒப்பந்த தொகை" : "Total Contract Spent"}
              </span>
              <p className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 truncate">
                {formatINR(summary.totalAmount)}
              </p>
              <span className="text-[11px] text-slate-400">
                {summary.recordsCount} {summary.recordsCount === 1 ? "record" : "records"}
              </span>
            </div>
          </div>

          {/* 2. Total Paid */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
                {locale === "ta" ? "கொடுக்கப்பட்ட தொகை" : "Total Paid Amount"}
              </span>
              <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-0.5 truncate">
                {formatINR(summary.paidAmount)}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">
                {summary.totalAmount > 0
                  ? `${Math.round((summary.paidAmount / summary.totalAmount) * 100)}% settled`
                  : "0%"}
              </span>
            </div>
          </div>

          {/* 3. Outstanding Balance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
                {locale === "ta" ? "நிலுவைத் தொகை" : "Outstanding Balance"}
              </span>
              <p className="text-lg sm:text-xl font-bold text-amber-600 mt-0.5 truncate">
                {formatINR(summary.balanceAmount)}
              </p>
              <span className="text-[11px] text-slate-400">
                {summary.balanceAmount > 0 ? "Pending to settle" : "All cleared"}
              </span>
            </div>
          </div>

          {/* 4. Active Contractors */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block truncate">
                {locale === "ta" ? "ஒப்பந்ததாரர்கள்" : "Contractors / Kothanar"}
              </span>
              <p className="text-lg sm:text-xl font-bold text-indigo-600 mt-0.5 truncate">
                {summary.contractorCount}
              </p>
              <span className="text-[11px] text-slate-400">Active contractors</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={
                locale === "ta"
                  ? "ஒப்பந்ததாரர், வேலை விவரம் தேடுக..."
                  : "Search contractor, work description, phone, stage..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="ALL">{locale === "ta" ? "அனைத்து நிலைகளும்" : "All Status"}</option>
              <option value="PAID">{locale === "ta" ? "கொடுக்கப்பட்டது (PAID)" : "Paid"}</option>
              <option value="PARTIAL">{locale === "ta" ? "பகுதி கொடுத்தது (PARTIAL)" : "Partial"}</option>
              <option value="UNPAID">{locale === "ta" ? "கொடுக்கப்படாதது (UNPAID)" : "Unpaid"}</option>
            </select>

            {/* Stage Filter */}
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="ALL">{locale === "ta" ? "அனைத்து நிலைகள்" : "All Stages"}</option>
              {CONSTRUCTION_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Section: Records */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span>{t("common.loading")}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Briefcase className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {search || stageFilter !== "ALL" || statusFilter !== "ALL"
                ? "No matching contract expenses found"
                : "No contract expenses recorded yet"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search || stageFilter !== "ALL" || statusFilter !== "ALL"
                ? "Try clearing your search query or adjusting your filters."
                : "Record contract agreements, mason advances, or lump-sum payments to contractors."}
            </p>
            {!search && stageFilter === "ALL" && statusFilter === "ALL" && (
              <button
                onClick={openAddModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{locale === "ta" ? "+ முதல் ஒப்பந்த செலவை சேர்க்க" : "+ Add First Contract Expense"}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Contractor / Kothanar</th>
                    <th className="py-3.5 px-4">Work Scope</th>
                    <th className="py-3.5 px-4">Stage</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Contract Total</th>
                    <th className="py-3.5 px-4 text-right">Paid</th>
                    <th className="py-3.5 px-4 text-right">Balance</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      {/* Contractor Name & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.contractorName || item.itemDescription || "Contractor / Kothanar"}</div>
                        {item.phoneNumber && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{item.phoneNumber}</span>
                          </div>
                        )}
                      </td>

                      {/* Work Description */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 line-clamp-1 max-w-[220px]" title={item.itemDescription}>
                          {item.itemDescription}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[220px]">
                          {item.category}
                        </span>
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[130px]" title={item.stage}>
                            {item.stage}
                          </span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {formatDate(item.expenseDate)}
                      </td>

                      {/* Total Contract Amount */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(item.totalAmount)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-4 text-right font-semibold text-emerald-600 whitespace-nowrap">
                        {formatINR(item.paidAmount)}
                      </td>

                      {/* Balance Amount */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {item.balanceAmount > 0 ? (
                          <span className="font-semibold text-amber-600">{formatINR(item.balanceAmount)}</span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">₹ 0</span>
                        )}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item.paymentStatus === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : item.paymentStatus === "PARTIAL"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {item.paymentStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="Edit Contract Expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Contract Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="md:hidden space-y-3">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{item.contractorName || item.itemDescription || "Contractor / Kothanar"}</div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">{item.itemDescription}</p>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        item.paymentStatus === "PAID"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.paymentStatus === "PARTIAL"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {item.paymentStatus}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
                      <Layers className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{item.stage}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(item.expenseDate)}</span>
                    </span>
                    {item.phoneNumber && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{item.phoneNumber}</span>
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-50 rounded-xl p-2.5 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total</span>
                      <span className="font-bold text-slate-900">{formatINR(item.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Paid</span>
                      <span className="font-bold text-emerald-600">{formatINR(item.paidAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Balance</span>
                      <span className="font-bold text-amber-600">{formatINR(item.balanceAmount)}</span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/40 p-2 rounded-lg border border-amber-100">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{t("common.edit")}</span>
                    </button>
                    <button
                      onClick={() => setDeletingId(item.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-medium text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t("common.delete")}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add / Edit Contract Expense Modal */}
        {(showAddModal || editingEntry) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold">
                      {editingEntry
                        ? locale === "ta"
                          ? "ஒப்பந்த செலவை திருத்து"
                          : "Edit Contract Expense"
                        : locale === "ta"
                        ? "புதிய ஒப்பந்த செலவு சேர்க்க"
                        : "Add Contract Expense"}
                    </h2>
                    <p className="text-xs text-blue-100">
                      {locale === "ta"
                        ? "கொத்தனார் / ஒப்பந்ததாரர் கட்டண விவரங்கள்"
                        : "Track payments given to contractor or Kothanar"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
                {/* Contractor Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      {locale === "ta" ? "ஒப்பந்ததாரர் / கொத்தனார் பெயர்" : "Contractor / Kothanar"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Murugan - Civil Kothanar"
                      value={formData.contractorName}
                      onChange={(e) => setFormData({ ...formData, contractorName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      {locale === "ta" ? "தொலைபேசி எண்" : "Phone Number"}
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                {/* Work Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {locale === "ta" ? "ஒப்பந்த வேலை விவரம்" : "Work Description / Scope"} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Plinth beam & brick masonry contract / Centering & roof slab"
                    value={formData.itemDescription}
                    onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Category & Stage with SelectWithAddValue */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      {t("expenses.category")}
                    </label>
                    <SelectWithAddValue
                      value={formData.category}
                      onChange={(val) => setFormData({ ...formData, category: val })}
                      options={CONTRACT_CATEGORIES}
                      storageKey="contract_categories"
                      addModalTitle="Add Contract Category"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      {t("expenses.stage")}
                    </label>
                    <SelectWithAddValue
                      value={formData.stage}
                      onChange={(val) => setFormData({ ...formData, stage: val })}
                      options={CONSTRUCTION_STAGES}
                      storageKey="contract_stages"
                      addModalTitle="Add Construction Stage"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
                    />
                  </div>
                </div>

                {/* Date & Payment Method with SelectWithAddValue */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      {t("common.date")} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.expenseDate}
                      onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      {t("expenses.paymentMethod")}
                    </label>
                    <SelectWithAddValue
                      value={formData.paymentMethod}
                      onChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                      options={PAYMENT_METHODS}
                      storageKey="contract_payment_methods"
                      addModalTitle="Add Payment Method"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
                    />
                  </div>
                </div>

                {/* Amount Fields: Total Amount & Paid Amount (Standard text/number inputs without spinners) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      {locale === "ta" ? "மொத்த ஒப்பந்த தொகை (₹)" : "Total Contract Amount (₹)"} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 font-medium">₹</span>
                      <input
                        type="number"
                        required
                        min="1"
                        step="any"
                        placeholder="50000"
                        value={formData.totalAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({
                            ...formData,
                            totalAmount: val,
                            // If paid amount was empty or equal to previous total, keep in sync
                            paidAmount: formData.paidAmount === "" || formData.paidAmount === formData.totalAmount ? val : formData.paidAmount,
                          });
                        }}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                      {locale === "ta" ? "கொடுக்கப்பட்ட தொகை (₹)" : "Paid Amount (₹)"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-slate-400 font-medium">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="25000"
                        value={formData.paidAmount}
                        onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                        className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
                      />
                    </div>
                    {/* Live balance indicator */}
                    <p className="text-[11px] text-slate-500 mt-1">
                      {formData.totalAmount && !isNaN(Number(formData.totalAmount)) ? (
                        <>
                          Balance:{" "}
                          <span className="font-semibold text-amber-600">
                            {formatINR(
                              Math.max(
                                0,
                                Number(formData.totalAmount) -
                                  (formData.paidAmount !== "" ? Number(formData.paidAmount) : 0)
                              )
                            )}
                          </span>
                        </>
                      ) : (
                        "User manually enters total & paid amount"
                      )}
                    </p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    {t("common.notes")}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Milestones, payment terms, or remarks..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? t("common.loading") : t("common.save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 text-center animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {locale === "ta" ? "ஒப்பந்த செலவை நீக்கவா?" : "Delete Contract Expense?"}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                {t("common.confirmDelete")}
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingId(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deletingId)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-500/20 transition cursor-pointer"
                >
                  {actionLoading ? t("common.loading") : t("common.delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
