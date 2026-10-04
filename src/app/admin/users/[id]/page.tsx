"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/utils/currency";
import { ArrowLeft, User, Building, Receipt, Clock, ShieldAlert } from "lucide-react";

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="py-16 text-center text-slate-400">Loading user profile and history...</div>;
  }

  if (!data?.user) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p>User not found.</p>
        <Link href="/admin/users" className="mt-4 inline-block text-amber-400 underline text-xs">
          Return to user list
        </Link>
      </div>
    );
  }

  const u = data.user;
  const es = data.expensesSummary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Users</span>
        </Link>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            u.isActive
              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
              : "bg-rose-950 text-rose-400 border border-rose-800"
          }`}
        >
          {u.isActive ? "Account Active" : "Account Suspended"}
        </span>
      </div>

      {/* User Header Profile */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xl uppercase">
            {u.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>{u.name}</span>
              {u.role === "ADMIN" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SYSTEM ADMIN
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400">
              @{u.username} • {u.email}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Registered: {formatDate(u.createdAt)} • Preferred Language: {u.preferredLanguage.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Spent Across Projects
          </span>
          <p className="text-xl font-bold text-amber-400 mt-1">{formatINR(es?.total || 0)}</p>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Material Purchases
          </span>
          <p className="text-xl font-bold text-white mt-1">{formatINR(es?.material || 0)}</p>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Labour & Wages
          </span>
          <p className="text-xl font-bold text-white mt-1">{formatINR(es?.labour || 0)}</p>
        </div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Transactions
          </span>
          <p className="text-xl font-bold text-white mt-1">{es?.count || 0}</p>
        </div>
      </div>

      {/* Houses Portfolio */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-400" />
            <span>House Construction Projects ({u.houses?.length || 0})</span>
          </h2>
        </div>

        <div className="divide-y divide-slate-800">
          {u.houses && u.houses.length > 0 ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            u.houses.map((h: any) => (
              <div key={h.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-sm">{h.name}</h3>
                  <p className="text-xs text-slate-400">
                    Owner: {h.ownerName} • {h.location} • Started: {formatDate(h.startDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-amber-400 block">{formatINR(h.estimatedBudget)}</span>
                  <span className="text-[10px] text-slate-500">{h._count?.expenses || 0} expenses recorded</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No houses registered for this user.</div>
          )}
        </div>
      </div>

      {/* Audit Logs History */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Recent Activity Audit Trail</span>
          </h2>
        </div>

        <div className="divide-y divide-slate-800">
          {u.auditLogs && u.auditLogs.length > 0 ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            u.auditLogs.map((log: any) => (
              <div key={log.id} className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-400 font-mono">{log.action}</span>
                  <span className="text-slate-400 ml-2">on {log.resource}</span>
                  {log.metadata && <span className="text-slate-500 ml-2 font-mono text-[11px]">{log.metadata}</span>}
                </div>
                <span className="text-slate-500">{formatDate(log.createdAt)}</span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">No recent activity records.</div>
          )}
        </div>
      </div>
    </div>
  );
}
