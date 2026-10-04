"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { toInputDateFormat } from "@/lib/utils/currency";
import { Building2, X, Sparkles } from "lucide-react";
import SelectWithAddValue from "@/components/ui/SelectWithAddValue";

export default function CreateHouseModal() {
  const pathname = usePathname();
  const { t, locale } = useLanguage();
  const { showCreateHouseModal, setShowCreateHouseModal, refreshUserData, houses, user } = useHouse();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    ownerName: "",
    location: "",
    startDate: toInputDateFormat(new Date()),
    expectedCompletionDate: "",
    estimatedBudget: "",
    numberOfFloors: 1,
    houseType: "Independent House",
    notes: "",
  });

  // Strict Guards: Never render this popup if:
  // 1. showCreateHouseModal is false
  // 2. User is not authenticated
  // 3. User is an Administrator (Admin views statistics, not personal house setup)
  // 4. Current page is Home (/), Login, Register, Forgot Password, or Admin portal
  if (
    !showCreateHouseModal ||
    !user ||
    user.role === "ADMIN" ||
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  const isFirstHouse = houses.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.ownerName || !formData.location || !formData.estimatedBudget) {
      error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/houses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          estimatedBudget: parseFloat(formData.estimatedBudget),
          numberOfFloors: Number(formData.numberOfFloors),
        }),
      });

      const json = await res.json();
      if (json.success) {
        success(isFirstHouse ? "Welcome! Your house project is ready." : "House project created successfully!");
        setShowCreateHouseModal(false);
        await refreshUserData();
      } else {
        error(json.message || "Failed to create house");
      }
    } catch {
      error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {isFirstHouse
                  ? locale === "ta"
                    ? "BuildLedger அமைவு — புதிய வீடு"
                    : "BuildLedger Setup — New House Project"
                  : t("house.createNew")}
              </h2>
              <p className="text-xs text-blue-100">
                {isFirstHouse
                  ? locale === "ta"
                    ? "உங்கள் கட்டுமான செலவுகளை எளிதாக நிர்வகிக்கவும்."
                    : "Build Smarter. Track Every Expense."
                  : "Add another house project to your account"}
              </p>
            </div>
          </div>
          {/* Always allow closing the modal */}
          <button
            onClick={() => setShowCreateHouseModal(false)}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("house.name")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. My New House / என் புது வீடு"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("house.owner")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Dhinesh"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("house.location")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chennai / Madurai"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("house.estimatedBudget")} (₹ INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-medium">₹</span>
              <input
                type="number"
                required
                min="1000"
                step="1000"
                placeholder="2500000"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {formData.estimatedBudget && !isNaN(Number(formData.estimatedBudget))
                ? `₹ ${Number(formData.estimatedBudget).toLocaleString("en-IN")}`
                : "e.g. 25,00,000 for 25 Lakhs"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("house.startDate")} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("house.completionDate")}
              </label>
              <input
                type="date"
                value={formData.expectedCompletionDate}
                onChange={(e) => setFormData({ ...formData, expectedCompletionDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("house.numberOfFloors")}
              </label>
              <select
                value={formData.numberOfFloors}
                onChange={(e) => setFormData({ ...formData, numberOfFloors: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
              >
                <option value={1}>G (Ground Floor)</option>
                <option value={2}>G + 1 (2 Floors)</option>
                <option value={3}>G + 2 (3 Floors)</option>
                <option value={4}>G + 3 (4 Floors)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t("house.houseType")}
              </label>
              <SelectWithAddValue
                value={formData.houseType}
                onChange={(val) => setFormData({ ...formData, houseType: val })}
                options={[
                  "Independent House",
                  "Villa",
                  "Apartment / Flat",
                  "Farmhouse",
                  "Commercial / Renovation",
                ]}
                storageKey="house_types"
                addModalTitle="Add House Type"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              {t("common.notes")}
            </label>
            <textarea
              rows={2}
              placeholder="Any additional notes or specifications..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateHouseModal(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? t("common.loading") : t("common.save")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
