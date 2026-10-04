"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { toInputDateFormat } from "@/lib/utils/currency";
import SelectWithAddValue from "@/components/ui/SelectWithAddValue";
import {
  X,
  Upload,
  Receipt,
  FileCheck,
  Check,
  ChevronRight,
} from "lucide-react";

interface ExpenseData {
  id?: string;
  expenseDate: string;
  expenseType: string;
  category: string;
  stage: string;
  itemDescription: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  supplierName: string;
  workerName: string;
  contractorName: string;
  phoneNumber: string;
  paymentMethod: string;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  receiptUrl: string;
  notes: string;
}

export default function ExpenseModal({
  editingExpense,
  onClose,
  onSuccess,
}: {
  editingExpense?: ExpenseData | null;
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const { t, locale } = useLanguage();
  const { showExpenseModal, setShowExpenseModal, activeHouse, setShowCreateHouseModal } = useHouse();
  const { success, error } = useToast();

  const isModalOpen = Boolean(showExpenseModal || editingExpense);

  const [categories, setCategories] = useState<Array<{ id: string; name: string; nameTa?: string; type: string }>>([]);
  const [stages, setStages] = useState<Array<{ id: string; name: string; nameTa?: string }>>([]);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<ExpenseData>({
    expenseDate: toInputDateFormat(new Date()),
    expenseType: "MATERIAL",
    category: "Cement",
    stage: "3. Foundation & Earthwork",
    itemDescription: "",
    quantity: 1,
    unit: "Unit",
    unitPrice: 0,
    totalAmount: 0,
    supplierName: "",
    workerName: "",
    contractorName: "",
    phoneNumber: "",
    paymentMethod: "UPI",
    paidAmount: 0,
    balanceAmount: 0,
    paymentStatus: "PAID",
    receiptUrl: "",
    notes: "",
  });

  // Fetch categories and stages
  useEffect(() => {
    if (!isModalOpen) return;

    fetch("/api/categories")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setCategories(res.data);
      })
      .catch(() => {});

    fetch("/api/stages")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) setStages(res.data);
      })
      .catch(() => {});
  }, [isModalOpen]);

  // Handle edit or reset
  useEffect(() => {
    if (editingExpense) {
      setFormData({
        ...editingExpense,
        expenseDate: toInputDateFormat(editingExpense.expenseDate),
      });
    } else {
      setFormData({
        expenseDate: toInputDateFormat(new Date()),
        expenseType: "MATERIAL",
        category: "Cement",
        stage: "3. Foundation & Earthwork",
        itemDescription: "",
        quantity: 1,
        unit: "Unit",
        unitPrice: 0,
        totalAmount: 0,
        supplierName: "",
        workerName: "",
        contractorName: "",
        phoneNumber: "",
        paymentMethod: "UPI",
        paidAmount: 0,
        balanceAmount: 0,
        paymentStatus: "PAID",
        receiptUrl: "",
        notes: "",
      });
    }
  }, [editingExpense, showExpenseModal]);

  // Recalculate balance when totalAmount or paidAmount changes
  const handleTotalAmountChange = (total: number) => {
    setFormData((prev) => {
      const paid = prev.paidAmount > 0 ? Math.min(prev.paidAmount, total) : total;
      const bal = Math.max(0, total - paid);
      return {
        ...prev,
        totalAmount: total,
        unitPrice: total,
        quantity: 1,
        paidAmount: paid,
        balanceAmount: bal,
        paymentStatus: paid >= total && total > 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
      };
    });
  };

  const handlePaidAmountChange = (paid: number) => {
    setFormData((prev) => {
      const bal = Math.max(0, prev.totalAmount - paid);
      return {
        ...prev,
        paidAmount: paid,
        balanceAmount: bal,
        paymentStatus: paid >= prev.totalAmount && prev.totalAmount > 0 ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
      };
    });
  };

  // Receipt File Upload Handler
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) {
        setFormData((prev) => ({ ...prev, receiptUrl: json.url }));
        success("Receipt attached successfully");
      } else {
        error(json.message || "Failed to upload file");
      }
    } catch {
      error("File upload failed");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
    setShowExpenseModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeHouse) {
      error("Please create a house project first");
      setShowCreateHouseModal(true);
      return;
    }

    if (!formData.itemDescription || formData.totalAmount <= 0) {
      error("Please provide item description and positive total amount");
      return;
    }

    setSubmitting(true);
    try {
      const isEditing = Boolean(formData.id);
      const url = isEditing ? `/api/expenses/${formData.id}` : "/api/expenses";
      const method = isEditing ? "PUT" : "POST";

      const isContract =
        formData.expenseType === "CONTRACTOR" ||
        formData.category.toLowerCase().includes("contract") ||
        formData.category.toLowerCase().includes("kothanar");

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          quantity: 1,
          unit: "Unit",
          unitPrice: formData.totalAmount,
          supplierName: "",
          workerName: "",
          contractorName: isContract ? (formData.itemDescription || "Contractor") : "",
          phoneNumber: "",
          houseId: activeHouse.id,
        }),
      });

      const json = await res.json();
      if (json.success) {
        success(isEditing ? "Expense updated successfully" : "Expense recorded successfully!");
        handleClose();
        if (onSuccess) onSuccess();
      } else {
        error(json.message || "Failed to save expense");
      }
    } catch {
      error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isModalOpen) return null;

  // Predefined Expense Types
  const EXPENSE_TYPES = [
    { value: "MATERIAL", label: t("expenses.types.MATERIAL") || "Material" },
    { value: "LABOUR", label: t("expenses.types.LABOUR") || "Labour" },
    { value: "CONTRACTOR", label: t("expenses.types.CONTRACTOR") || "Contractor / Kothanar" },
    { value: "TRANSPORTATION", label: t("expenses.types.TRANSPORTATION") || "Transportation" },
    { value: "EQUIPMENT", label: t("expenses.types.EQUIPMENT") || "Equipment" },
    { value: "SERVICE", label: t("expenses.types.SERVICE") || "Service" },
    { value: "MISCELLANEOUS", label: t("expenses.types.MISCELLANEOUS") || "Miscellaneous" },
  ];

  // Predefined Categories from API or fallback
  const categoryOptions =
    categories.length > 0
      ? categories.map((c) => ({
          value: c.name,
          label: locale === "ta" && c.nameTa ? c.nameTa : c.name,
        }))
      : [
          { value: "Cement", label: "Cement" },
          { value: "Steel", label: "Steel" },
          { value: "Sand / M-Sand", label: "Sand / M-Sand" },
          { value: "Bricks / Blocks", label: "Bricks / Blocks" },
          { value: "Stone / Jelly", label: "Stone / Jelly" },
          { value: "Tiles / Marble", label: "Tiles / Marble" },
          { value: "Plumbing", label: "Plumbing" },
          { value: "Electrical", label: "Electrical" },
          { value: "Painting", label: "Painting" },
          { value: "Wood & Doors", label: "Wood & Doors" },
        ];

  // Predefined Stages from API or fallback
  const stageOptions =
    stages.length > 0
      ? stages.map((s) => ({
          value: s.name,
          label: locale === "ta" && s.nameTa ? s.nameTa : s.name,
        }))
      : [
          { value: "1. Land & Approval", label: "1. Land & Approval" },
          { value: "2. Site Cleaning & Marking", label: "2. Site Cleaning & Marking" },
          { value: "3. Foundation & Earthwork", label: "3. Foundation & Earthwork" },
          { value: "4. Basement Construction", label: "4. Basement Construction" },
          { value: "5. Column / Pillar Work", label: "5. Column / Pillar Work" },
          { value: "6. Brickwork / Wall Construction", label: "6. Brickwork / Wall Construction" },
          { value: "7. Roofing & Slab Concreting", label: "7. Roofing & Slab Concreting" },
          { value: "8. Electrical Concealed Piping", label: "8. Electrical Concealed Piping" },
          { value: "9. Plumbing Concealed Lines", label: "9. Plumbing Concealed Lines" },
          { value: "10. Wall Plastering", label: "10. Wall Plastering" },
          { value: "11. Flooring & Tiling", label: "11. Flooring & Tiling" },
          { value: "12. Doors & Windows", label: "12. Doors & Windows" },
          { value: "13. Painting & Finishing", label: "13. Painting & Finishing" },
        ];

  // Predefined Payment Methods
  const PAYMENT_METHODS = [
    { value: "UPI", label: "UPI (GPay / PhonePe / Paytm)" },
    { value: "CASH", label: "Cash" },
    { value: "BANK_TRANSFER", label: "Bank Transfer (NEFT / IMPS)" },
    { value: "CARD", label: "Debit / Credit Card" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "CREDIT", label: "Credit (Pay Later)" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 sm:px-6 py-3.5 sm:py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {formData.id ? t("expenses.editExpense") : t("expenses.addNew")}
              </h2>
              <p className="text-xs text-blue-100 flex items-center gap-1.5">
                <span>{activeHouse?.name}</span>
                <ChevronRight className="w-3 h-3 text-blue-200" />
                <span>{locale === "ta" ? "செலவு பதிவு" : "Quick Entry"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Section 1: Basic Info */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              1. {t("expenses.basicInfo")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("expenses.date")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("expenses.type")} <span className="text-rose-500">*</span>
                </label>
                <SelectWithAddValue
                  value={formData.expenseType}
                  onChange={(val) => setFormData({ ...formData, expenseType: val })}
                  options={EXPENSE_TYPES}
                  storageKey="expense_types"
                  addModalTitle="Add Custom Expense Type"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("expenses.category")} <span className="text-rose-500">*</span>
                </label>
                <SelectWithAddValue
                  value={formData.category}
                  onChange={(val) => setFormData({ ...formData, category: val })}
                  options={categoryOptions}
                  storageKey="expense_categories"
                  addModalTitle="Add Custom Category"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("expenses.stage")} <span className="text-rose-500">*</span>
                </label>
                <SelectWithAddValue
                  value={formData.stage}
                  onChange={(val) => setFormData({ ...formData, stage: val })}
                  options={stageOptions}
                  storageKey="construction_stages"
                  addModalTitle="Add Custom Construction Stage"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Expense Details (Only Item Description and Total Amount) */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              2. {t("expenses.expenseDetails")}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("expenses.itemDescription")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UltraTech Cement bags / Electrical cables / Mason work"
                  value={formData.itemDescription}
                  onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("expenses.totalAmount")} (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="e.g. 25000"
                  value={formData.totalAmount || ""}
                  onChange={(e) => handleTotalAmountChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-400 bg-white font-bold text-blue-700 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Details */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              3. {t("expenses.paymentInfo")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("expenses.paymentMethod")}
                </label>
                <SelectWithAddValue
                  value={formData.paymentMethod}
                  onChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                  options={PAYMENT_METHODS}
                  storageKey="payment_methods"
                  addModalTitle="Add Custom Payment Method"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("expenses.paidAmount")} (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={formData.paidAmount}
                  onChange={(e) => handlePaidAmountChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("expenses.balanceAmount")} (₹)
                </label>
                <input
                  type="text"
                  readOnly
                  value={`₹ ${formData.balanceAmount.toLocaleString("en-IN")}`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between px-1">
              <span className="text-xs text-slate-500 font-medium">Payment Status:</span>
              <span
                className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold ${
                  formData.paymentStatus === "PAID"
                    ? "bg-emerald-100 text-emerald-800"
                    : formData.paymentStatus === "PARTIAL"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {formData.paymentStatus === "PAID" ? "✓ Fully Paid" : formData.paymentStatus === "PARTIAL" ? "Partially Paid" : "Unpaid"}
              </span>
            </div>
          </div>

          {/* Section 4: Receipt Attachment & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("expenses.receipt")}
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition text-xs font-medium text-slate-600">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>{uploadingReceipt ? "Uploading..." : formData.receiptUrl ? "Replace Bill" : "Upload Bill/Receipt"}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleReceiptUpload}
                    disabled={uploadingReceipt}
                  />
                </label>
                {formData.receiptUrl && (
                  <a
                    href={formData.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition text-xs flex items-center gap-1 font-semibold"
                  >
                    <FileCheck className="w-4 h-4" /> View
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t("common.notes")}
              </label>
              <input
                type="text"
                placeholder="Optional notes or invoice number..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{submitting ? t("common.loading") : t("common.save")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
