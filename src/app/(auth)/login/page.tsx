"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/lib/context/ToastContext";
import { useHouse } from "@/lib/context/HouseContext";
import { Building2, Eye, EyeOff, Lock, User, ArrowRight, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const { t, locale, setLocale } = useLanguage();
  const { success, error } = useToast();
  const { refreshUserData } = useHouse();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const json = await res.json();
      if (json.success) {
        success(locale === "ta" ? "வெற்றிகரமாக உள்நுழைந்தீர்கள்!" : "Login successful! Welcome back.");
        await refreshUserData();
        router.push("/dashboard");
      } else {
        setErrorMessage(json.message || "Invalid credentials");
        error(json.message || "Login failed");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-start sm:justify-center py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8">
      {/* Top navigation with language toggle */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white text-xs font-medium transition"
        >
          <Building2 className="w-4 h-4 text-blue-400" />
          <span>BuildLedger</span>
        </Link>
        <div className="flex items-center bg-white/10 backdrop-blur rounded-lg p-0.5 text-xs font-semibold text-white">
          <button
            onClick={() => setLocale("en")}
            className={`px-2.5 py-1 rounded transition ${locale === "en" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:text-white"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale("ta")}
            className={`px-2.5 py-1 rounded transition ${locale === "ta" ? "bg-blue-600 text-white shadow" : "text-slate-300 hover:text-white"}`}
          >
            தமிழ்
          </button>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          {t("auth.loginTitle")}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-300">
          {t("auth.loginSubtitle")}
        </p>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium animate-in fade-in">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {t("auth.username")} / {t("auth.email")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="username or email@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {t("auth.password")}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? t("common.loading") : t("auth.loginButton")}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t("auth.dontHaveAccount")}</span>
            <Link
              href="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              {t("auth.registerButton")}
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-amber-600 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Portal Access</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
