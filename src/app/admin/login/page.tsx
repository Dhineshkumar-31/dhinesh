"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/context/ToastContext";
import { useHouse } from "@/lib/context/HouseContext";
import { ShieldCheck, Lock, User, ArrowRight, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const { success, error } = useToast();
  const { refreshUserData } = useHouse();
  const router = useRouter();

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      const json = await res.json();
      if (json.success) {
        success("Administrator access granted");
        await refreshUserData();
        router.push("/admin");
      } else {
        setErr(json.message || "Invalid administrative credentials");
        error(json.message || "Access denied");
      }
    } catch {
      setErr("Failed to contact server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-start sm:justify-center py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8">
      {/* Top navigation */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-medium transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Site</span>
        </Link>
        <span className="text-xs text-amber-500 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
          Admin Portal
        </span>
      </div>

      <div className="w-full max-w-md mx-auto text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/10 mb-3">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          BuildLedger Admin Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Build Smarter. Track Every Expense. • Secure System Control
        </p>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="bg-slate-900 border border-slate-800 py-6 sm:py-8 px-4 sm:px-10 shadow-2xl rounded-2xl">
          {err && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-medium">
              {err}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer shadow-lg shadow-amber-400/20"
              >
                <span>{loading ? "Authenticating..." : "Enter Admin Portal"}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Regular User Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
