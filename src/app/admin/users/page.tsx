"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatINR, formatDate } from "@/lib/utils/currency";
import { useToast } from "@/lib/context/ToastContext";
import { Users, Search, ExternalLink, ShieldCheck, UserX, UserCheck } from "lucide-react";

interface AdminUserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string | null;
  houseCount: number;
  expenseCount: number;
  totalExpensesAmount: number;
}

export default function AdminUsersPage() {
  const { success, error } = useToast();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch {
      error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  }, [search, error]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (id: string, currentStatus: boolean, userName: string) => {
    const nextStatus = !currentStatus;
    const actionName = nextStatus ? "enable" : "disable";
    if (!confirm(`Are you sure you want to ${actionName} user account "${userName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        success(`User ${actionName}d successfully`);
        fetchUsers();
      } else {
        error(json.message || "Failed to update user status");
      }
    } catch {
      error("Network error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>User Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory of all registered builders, project owners, and administrators.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, @username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Houses</th>
                <th className="py-3 px-4">Total Spent</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.role === "ADMIN" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">@{u.username}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{u.email}</td>
                    <td className="py-3.5 px-4 font-bold text-amber-400">{u.houseCount}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">
                      {formatINR(u.totalExpensesAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(u.createdAt)}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {u.lastLogin ? formatDate(u.lastLogin) : "Never"}
                    </td>
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
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-900 transition"
                          title="View Details"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {u.role !== "ADMIN" && (
                          <button
                            onClick={() => handleToggleStatus(u.id, u.isActive, u.name)}
                            className={`p-1.5 rounded-lg transition ${
                              u.isActive
                                ? "text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                                : "text-slate-400 hover:text-emerald-400 hover:bg-slate-900"
                            }`}
                            title={u.isActive ? "Disable User Account" : "Enable User Account"}
                          >
                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No users match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
