"use client";

import React, { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import { formatINR, formatDate, toInputDateFormat } from "@/lib/utils/currency";
import { Package, PlusCircle, Search, Layers, Calendar, Building, X } from "lucide-react";
import SelectWithAddValue from "@/components/ui/SelectWithAddValue";

interface MaterialItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
  supplier?: string | null;
  purchaseDate: string;
  invoiceNumber?: string | null;
  notes?: string | null;
}

export default function MaterialsPage() {
  const { t } = useLanguage();
  const { activeHouse } = useHouse();
  const { success, error } = useToast();

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "Cement",
    quantity: 1,
    unit: "Bag",
    unitPrice: 0,
    totalCost: 0,
    supplier: "",
    purchaseDate: toInputDateFormat(new Date()),
    invoiceNumber: "",
    notes: "",
  });

  const fetchMaterials = useCallback(async () => {
    if (!activeHouse) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/materials?houseId=${activeHouse.id}`);
      const json = await res.json();
      if (json.success) {
        setMaterials(json.data);
        setTotalCost(json.totalCost);
      }
    } catch {
      error("Failed to load materials");
    } finally {
      setLoading(false);
    }
  }, [activeHouse, error]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHouse) return;

    try {
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, houseId: activeHouse.id }),
      });
      const json = await res.json();
      if (json.success) {
        success("Material recorded successfully");
        setShowAddModal(false);
        setForm({
          name: "",
          category: "Cement",
          quantity: 1,
          unit: "Bag",
          unitPrice: 0,
          totalCost: 0,
          supplier: "",
          purchaseDate: toInputDateFormat(new Date()),
          invoiceNumber: "",
          notes: "",
        });
        fetchMaterials();
      } else {
        error(json.message || "Failed to save material");
      }
    } catch {
      error("Network error");
    }
  };

  const filtered = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase()) ||
      (m.supplier && m.supplier.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-blue-600" />
              <span>{t("materials.title")}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Track building material stock, quantities, and supplier bills.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 active:scale-95 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("materials.addNew")}</span>
          </button>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Material Spent</span>
            <p className="text-xl font-bold text-blue-600 mt-1">{formatINR(totalCost)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Material Purchases</span>
            <p className="text-xl font-bold text-slate-800 mt-1">{materials.length} records</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Filter</span>
            <div className="relative mt-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search cement, steel, bricks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Materials List / Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Mobile Card View (< md) */}
          <div className="block md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading materials...
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((m) => (
                <div key={m.id} className="p-4 hover:bg-slate-50/70 transition space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {formatDate(m.purchaseDate)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
                      {m.category}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{m.name}</h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {m.quantity} {m.unit} @ ₹{m.unitPrice}
                      </p>
                      {(m.supplier || m.invoiceNumber) && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          {m.supplier && <span>Vendor: {m.supplier}</span>}
                          {m.supplier && m.invoiceNumber && <span> • </span>}
                          {m.invoiceNumber && <span>Inv: #{m.invoiceNumber}</span>}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-blue-600 block">{formatINR(m.totalCost)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No material records found. Add your first material above!
              </div>
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Material Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Quantity & Unit</th>
                  <th className="py-3 px-4">Unit Rate</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Invoice #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading materials...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(m.purchaseDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {m.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {m.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {m.quantity} {m.unit}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatINR(m.unitPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatINR(m.totalCost)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {m.supplier || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {m.invoiceNumber || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No material records found. Add your first material above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Package className="w-5 h-5" />
                <span>{t("materials.addNew")}</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/10 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t("materials.materialName")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UltraTech Cement / 12mm TMT Steel"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("materials.category")}
                  </label>
                  <SelectWithAddValue
                    value={form.category}
                    onChange={(val) => setForm({ ...form, category: val })}
                    options={[
                      "Cement",
                      "Steel & Rods",
                      "Bricks & Blocks",
                      "Sand & M-Sand",
                      "Aggregates / Jelly",
                      "Electrical",
                      "Plumbing",
                      "Tiles",
                      "Wood",
                      "Paint",
                      "Other",
                    ]}
                    storageKey="material_categories"
                    addModalTitle="Add Custom Material Category"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("materials.purchaseDate")}
                  </label>
                  <input
                    type="date"
                    required
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("materials.quantity")}
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={form.quantity}
                    onChange={(e) => {
                      const q = parseFloat(e.target.value) || 0;
                      setForm({ ...form, quantity: q, totalCost: q * form.unitPrice });
                    }}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("materials.unit")}
                  </label>
                  <SelectWithAddValue
                    value={form.unit}
                    onChange={(val) => setForm({ ...form, unit: val })}
                    options={[
                      "Bag",
                      "Tonne / Ton",
                      "Kg",
                      "Sq.Ft",
                      "Cu.Ft (CFT)",
                      "Load / Lorry",
                      "Tractor",
                      "Litre",
                      "Piece / Nos",
                      "Bundle",
                      "Meter",
                    ]}
                    storageKey="material_units"
                    addModalTitle="Add Custom Unit"
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("materials.unitPrice")} (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.unitPrice || ""}
                    onChange={(e) => {
                      const p = parseFloat(e.target.value) || 0;
                      setForm({ ...form, unitPrice: p, totalCost: form.quantity * p });
                    }}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("materials.totalCost")} (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.totalCost || ""}
                    onChange={(e) => setForm({ ...form, totalCost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t("materials.supplier")}
                  </label>
                  <input
                    type="text"
                    placeholder="Vendor Name"
                    value={form.supplier}
                    onChange={(e) => setForm({ ...form, supplier: e.target.value })}
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
