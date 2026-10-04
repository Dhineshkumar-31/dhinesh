"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { formatINR } from "@/lib/utils/currency";
import { Layers, PlusCircle, CheckCircle2, ChevronRight, X } from "lucide-react";

interface StageItem {
  id: string;
  name: string;
  nameTa?: string | null;
  orderIndex: number;
}

export default function StagesPage() {
  const { t, locale } = useLanguage();
  const { activeHouse } = useHouse();
  const { success, error } = useToast();

  const [stages, setStages] = useState<StageItem[]>([]);
  const [stageSpending, setStageSpending] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newStageNameTa, setNewStageNameTa] = useState("");

  const fetchData = useCallback(async () => {
    if (!activeHouse) return;
    setLoading(true);
    try {
      const [stagesRes, expensesRes] = await Promise.all([
        fetch("/api/stages"),
        fetch(`/api/expenses?houseId=${activeHouse.id}&limit=1000`),
      ]);

      const stagesJson = await stagesRes.json();
      const expensesJson = await expensesRes.json();

      if (stagesJson.success) {
        setStages(stagesJson.data);
      }

      if (expensesJson.success && expensesJson.data) {
        const spendingMap: Record<string, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expensesJson.data.forEach((e: any) => {
          spendingMap[e.stage] = (spendingMap[e.stage] || 0) + e.totalAmount;
        });
        setStageSpending(spendingMap);
      }
    } catch {
      error("Failed to load construction stages");
    } finally {
      setLoading(false);
    }
  }, [activeHouse, error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStageName.trim()) return;

    try {
      const res = await fetch("/api/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newStageName.trim(),
          nameTa: newStageNameTa.trim() || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        success("Custom construction stage added");
        setShowAddModal(false);
        setNewStageName("");
        setNewStageNameTa("");
        fetchData();
      } else {
        error(json.message || "Failed to add stage");
      }
    } catch {
      error("Network error");
    }
  };

  const totalSpentAllStages = Object.values(stageSpending).reduce((a, b) => a + b, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-600" />
              <span>{t("stages.title")}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track house construction milestones from Foundation to Roofing and Final Finishing.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Custom Stage</span>
          </button>
        </div>

        {/* Stages Timeline List */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading construction stages...</div>
          ) : stages.length > 0 ? (
            stages.map((st, idx) => {
              const spent = stageSpending[st.name] || 0;
              const percent = totalSpentAllStages > 0 ? (spent / totalSpentAllStages) * 100 : 0;
              const hasActivity = spent > 0;

              return (
                <div
                  key={st.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        hasActivity
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <span>{locale === "ta" && st.nameTa ? st.nameTa : st.name}</span>
                        {hasActivity && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                            Active
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Milestone Stage #{idx + 1}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {formatINR(spent)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {percent > 0 ? `${percent.toFixed(1)}% of total spent` : "No expenses yet"}
                      </span>
                    </div>

                    <div className="w-24 bg-slate-100 rounded-full h-2 hidden sm:block overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400">No construction stages configured.</div>
          )}
        </div>
      </div>

      {/* Add Custom Stage Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Layers className="w-5 h-5" />
                <span>Add Construction Stage</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStage} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stage Name (English) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Compound Wall & Gate"
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Stage Name (Tamil / தமிழ்)
                </label>
                <input
                  type="text"
                  placeholder="e.g. காம்பவுண்ட் சுவர் & கேட்"
                  value={newStageNameTa}
                  onChange={(e) => setNewStageNameTa(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
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
