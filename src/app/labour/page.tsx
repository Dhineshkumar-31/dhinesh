"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { formatINR, formatDate, toInputDateFormat } from "@/lib/utils/currency";
import { HardHat, PlusCircle, Search, Users, Calculator, X } from "lucide-react";
import SelectWithAddValue from "@/components/ui/SelectWithAddValue";

interface LabourEntryItem {
  id: string;
  workerName: string;
  labourType: string;
  workDate: string;
  numberOfWorkers: number;
  numberOfDays: number;
  dailyRate: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  notes?: string | null;
}

const LABOUR_TYPES = [
  "Mason (கொத்தனார்)",
  "Mason Assistant (சித்தாள்)",
  "Carpenter (தச்சு வேலை)",
  "Electrician (மின்சார வேலை)",
  "Plumber (குழாய் வேலை)",
  "Painter (வண்ணம் பூசுதல்)",
  "Tile Worker (டைல்ஸ் வேலை)",
  "Steel Bender / Worker (கம்பி கட்டுபவர்)",
  "Shuttering Worker (சென்டரிங்)",
  "General Labour (பொது கூலி)",
  "Site Supervisor (மேற்பார்வையாளர்)",
  "Other (இதர)",
];

export default function LabourPage() {
  const { t } = useLanguage();
  const { activeHouse } = useHouse();
  const { success, error } = useToast();

  const [entries, setEntries] = useState<LabourEntryItem[]>([]);
  const [summary, setSummary] = useState({ totalAmount: 0, paidAmount: 0, balanceAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    workerName: "",
    labourType: "Mason (கொத்தனார்)",
    workDate: toInputDateFormat(new Date()),
    dailyRate: 1200,
    numberOfWorkers: 1,
    numberOfDays: 1,
    totalAmount: 1200,
    paidAmount: 1200,
    paymentMethod: "CASH",
    notes: "",
  });

  const fetchLabour = useCallback(async () => {
    if (!activeHouse) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/labour?houseId=${activeHouse.id}`);
      const json = await res.json();
      if (json.success) {
        setEntries(json.data.entries);
        setSummary(json.data.summary);
      }
    } catch {
      error("Failed to load labour records");
    } finally {
      setLoading(false);
    }
  }, [activeHouse, error]);

  useEffect(() => {
    fetchLabour();
  }, [fetchLabour]);

  const handleCalcChange = (dailyRate: number, numberOfWorkers: number, numberOfDays: number) => {
    const total = dailyRate * numberOfWorkers * numberOfDays;
    setForm((prev) => ({
      ...prev,
      dailyRate,
      numberOfWorkers,
      numberOfDays,
      totalAmount: total,
      paidAmount: total, // default full paid
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHouse) return;

    try {
      const res = await fetch("/api/labour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, houseId: activeHouse.id }),
      });
      const json = await res.json();
      if (json.success) {
        success("Labour wage entry recorded successfully");
        setShowAddModal(false);
        setForm({
          workerName: "",
          labourType: "Mason (கொத்தனார்)",
          workDate: toInputDateFormat(new Date()),
          dailyRate: 1200,
          numberOfWorkers: 1,
          numberOfDays: 1,
          totalAmount: 1200,
          paidAmount: 1200,
          paymentMethod: "CASH",
          notes: "",
        });
        fetchLabour();
      } else {
        error(json.message || "Failed to record labour");
      }
    } catch {
      error("Network error");
    }
  };

  const filtered = entries.filter(
    (e) =>
      e.workerName.toLowerCase().includes(search.toLowerCase()) ||
      e.labourType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <HardHat className="w-6 h-6 text-blue-600" />
              <span>{t("labour.title")}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage mason wages, assistant workers, carpenters, daily attendance, and pending dues.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("labour.addNew")}</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Labour Spent</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{formatINR(summary.totalAmount)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Wages Paid</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{formatINR(summary.paidAmount)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Outstanding Labour Balance</span>
            <p className="text-xl font-bold text-rose-600 mt-1">{formatINR(summary.balanceAmount)}</p>
          </div>
        </div>

        {/* Labour Entries List / Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search worker or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400">{filtered.length} entries</span>
          </div>

          {/* Mobile Card View (< md) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading labour records...
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((e) => (
                <div key={e.id} className="p-4 hover:bg-slate-50/70 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {formatDate(e.workDate)}
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

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{e.workerName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {e.labourType}
                      </span>
                      <span className="text-xs text-slate-500">
                        {e.numberOfWorkers} worker(s) • {e.numberOfDays} day(s) @ ₹{e.dailyRate}/day
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">Total Wage:</span>{" "}
                      <span className="text-sm font-bold text-slate-900">{formatINR(e.totalAmount)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-emerald-600 font-semibold">Paid: {formatINR(e.paidAmount)}</span>
                      {e.balanceAmount > 0 && (
                        <span className="block text-[11px] text-rose-500 font-medium">
                          Bal: {formatINR(e.balanceAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No labour records found. Record your first wage entry above!
              </div>
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Worker / Lead Name</th>
                  <th className="py-3 px-4">Category / Skill</th>
                  <th className="py-3 px-4">Workers</th>
                  <th className="py-3 px-4">Days</th>
                  <th className="py-3 px-4">Daily Rate</th>
                  <th className="py-3 px-4 text-right">Total Wage</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      Loading labour records...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(e.workDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {e.workerName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {e.labourType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{e.numberOfWorkers}</td>
                      <td className="py-3.5 px-4 text-slate-700">{e.numberOfDays}</td>
                      <td className="py-3.5 px-4 text-slate-600">{formatINR(e.dailyRate)}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatINR(e.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-emerald-600">
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No labour entries recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Labour Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <HardHat className="w-5 h-5" />
                <span>{t("labour.addNew")}</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("labour.workerName")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Periyasamy (Head Mason)"
                  value={form.workerName}
                  onChange={(e) => setForm({ ...form, workerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("labour.labourType")}
                  </label>
                  <SelectWithAddValue
                    value={form.labourType}
                    onChange={(val) => setForm({ ...form, labourType: val })}
                    options={LABOUR_TYPES}
                    storageKey="labour_types"
                    addModalTitle="Add Custom Labour / Worker Skill"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("labour.workDate")}
                  </label>
                  <input
                    type="date"
                    required
                    value={form.workDate}
                    onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Wage Calculation Row */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>{t("labour.autoCalculateHint")}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {t("labour.dailyRate")} (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.dailyRate}
                      onChange={(e) =>
                        handleCalcChange(
                          parseFloat(e.target.value) || 0,
                          form.numberOfWorkers,
                          form.numberOfDays
                        )
                      }
                      className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Workers Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.numberOfWorkers}
                      onChange={(e) =>
                        handleCalcChange(
                          form.dailyRate,
                          parseInt(e.target.value) || 1,
                          form.numberOfDays
                        )
                      }
                      className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Days Worked
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={form.numberOfDays}
                      onChange={(e) =>
                        handleCalcChange(
                          form.dailyRate,
                          form.numberOfWorkers,
                          parseFloat(e.target.value) || 1
                        )
                      }
                      className="w-full px-2.5 py-1.5 border rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Wage (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.totalAmount}
                    onChange={(e) => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Paid Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.paidAmount}
                    onChange={(e) => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
                >
                  {t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
