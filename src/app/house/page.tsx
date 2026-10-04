"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { formatINR, formatDate, toInputDateFormat } from "@/lib/utils/currency";
import { Home, PlusCircle, Edit3, Check, Trash2, Building2 } from "lucide-react";

export default function MyHousePage() {
  const { t, locale } = useLanguage();
  const { houses, activeHouse, setActiveHouse, refreshUserData, setShowCreateHouseModal } = useHouse();
  const { success, error } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    ownerName: "",
    location: "",
    estimatedBudget: 0,
    startDate: "",
    expectedCompletionDate: "",
    numberOfFloors: 1,
    houseType: "Independent House",
    notes: "",
  });

  useEffect(() => {
    if (activeHouse) {
      setForm({
        name: activeHouse.name,
        ownerName: activeHouse.ownerName,
        location: activeHouse.location,
        estimatedBudget: activeHouse.estimatedBudget,
        startDate: toInputDateFormat(activeHouse.startDate),
        expectedCompletionDate: "",
        numberOfFloors: 1,
        houseType: "Independent House",
        notes: "",
      });
    }
  }, [activeHouse]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const res = await fetch(`/api/houses/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (json.success) {
        success("House details updated successfully");
        setEditingId(null);
        refreshUserData();
      } else {
        error(json.message || "Failed to update house");
      }
    } catch {
      error("Network error");
    }
  };

  const handleDeleteHouse = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete house project "${name}"?`)) return;

    try {
      const res = await fetch(`/api/houses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        success("House project deleted");
        refreshUserData();
      } else {
        error(json.message || "Failed to delete");
      }
    } catch {
      error("Network error");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Home className="w-6 h-6 text-blue-600" />
              <span>{t("house.title")}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Manage your house construction specifications, estimated budgets, and project timeline.
            </p>
          </div>

          <button
            onClick={() => setShowCreateHouseModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("house.createNew")}</span>
          </button>
        </div>

        {/* Houses List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {houses.map((h) => {
            const isActive = activeHouse?.id === h.id;
            const isEditingThis = editingId === h.id;

            return (
              <div
                key={h.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition flex flex-col justify-between ${
                  isActive ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-900 text-base">{h.name}</h2>
                        <p className="text-xs text-slate-500">
                          {h.ownerName} • {h.location}
                        </p>
                      </div>
                    </div>

                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        Active Project
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase">Estimated Budget</span>
                      <span className="font-bold text-slate-900 text-sm">{formatINR(h.estimatedBudget)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px] uppercase">Start Date</span>
                      <span className="font-semibold text-slate-700">{formatDate(h.startDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between gap-2">
                  {!isActive && (
                    <button
                      onClick={() => setActiveHouse(h)}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Set Active
                    </button>
                  )}

                  <div className="flex items-center gap-2 ml-auto">
                    <button
                      onClick={() => {
                        setEditingId(h.id);
                        setForm({
                          name: h.name,
                          ownerName: h.ownerName,
                          location: h.location,
                          estimatedBudget: h.estimatedBudget,
                          startDate: toInputDateFormat(h.startDate),
                          expectedCompletionDate: "",
                          numberOfFloors: 1,
                          houseType: "Independent House",
                          notes: "",
                        });
                      }}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {houses.length > 1 && (
                      <button
                        onClick={() => handleDeleteHouse(h.id, h.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Edit Form */}
                {isEditingThis && (
                  <form onSubmit={handleUpdate} className="mt-4 pt-4 border-t border-slate-200 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="font-semibold text-slate-600">House Name</label>
                        <input
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full px-2.5 py-1.5 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Owner Name</label>
                        <input
                          type="text"
                          required
                          value={form.ownerName}
                          onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                          className="w-full px-2.5 py-1.5 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Location</label>
                        <input
                          type="text"
                          required
                          value={form.location}
                          onChange={(e) => setForm({ ...form, location: e.target.value })}
                          className="w-full px-2.5 py-1.5 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-600">Budget (₹)</label>
                        <input
                          type="number"
                          required
                          value={form.estimatedBudget}
                          onChange={(e) => setForm({ ...form, estimatedBudget: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 border rounded-lg font-bold"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 border rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Update
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
