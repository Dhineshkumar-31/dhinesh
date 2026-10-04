"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/utils/currency";
import {
  Users,
  Building,
  Receipt,
  BadgeDollarSign,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function AdminDashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-amber-400" />
          <span>Platform Overview</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics on registered users, active houses, and overall construction finance recorded.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
          <span className="text-[11px] text-emerald-400 font-medium">
            {stats?.activeUsers || 0} currently active
          </span>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Houses</span>
            <Building className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalHouses || 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Active construction projects</span>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Expenses Logged</span>
            <Receipt className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats?.totalExpensesCount || 0}</p>
          <span className="text-[11px] text-slate-400 font-medium">Individual ledger transactions</span>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tracked Value</span>
            <BadgeDollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400">
            {formatINR(stats?.totalTrackedValue || 0)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">Cumulative financial volume</span>
        </div>
      </div>

      {/* User Registration Trend Chart */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
        <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span>New User Signups (Monthly)</span>
        </h2>
        <div className="h-60 w-full">
          {stats?.registrationTrend ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.registrationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", color: "#fff" }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              Loading trends...
            </div>
          )}
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Latest Registered Users</span>
          </h2>
          <Link
            href="/admin/users"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
          >
            <span>View All Users</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Houses</th>
                <th className="py-3 px-4">Joined</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {stats?.latestUsers?.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-900/50">
                  <td className="py-3.5 px-4 font-semibold text-white">{u.name}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">@{u.username}</td>
                  <td className="py-3.5 px-4">{u.email}</td>
                  <td className="py-3.5 px-4 font-bold text-amber-400">{u._count.houses}</td>
                  <td className="py-3.5 px-4 text-slate-500">{formatDate(u.createdAt)}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.isActive
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-rose-950 text-rose-400 border border-rose-800"
                      }`}
                    >
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
