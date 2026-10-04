"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useToast } from "@/lib/context/ToastContext";
import { useHouse } from "@/lib/context/HouseContext";
import { Building2, Lock, Mail, User, ArrowRight, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const { t, locale, setLocale } = useLanguage();
  const { success, error } = useToast();
  const { refreshUserData } = useHouse();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = "Full name must be at least 2 characters";
    }
    if (!formData.username.trim() || formData.username.trim().length < 3) {
      errs.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) {
      errs.username = "Username can only contain letters, numbers, and _.-";
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Please enter a valid email address";
    }
    if (!formData.password || formData.password.length < 8) {
      errs.password = "Password must be at least 8 characters long";
    }
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        success(locale === "ta" ? "கணக்கு உருவாக்கப்பட்டது! நல்வரவு." : "Account created successfully! Welcome.");
        await refreshUserData();
        router.push("/dashboard");
      } else {
        if (json.errors) {
          setFieldErrors(json.errors);
        } else {
          error(json.message || "Registration failed");
        }
      }
    } catch {
      error("Network error. Please try again.");
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
          {t("auth.registerTitle")}
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-300">
          {t("auth.registerSubtitle")}
        </p>
      </div>

      <div className="w-full max-w-md mx-auto">
        <div className="bg-white py-6 sm:py-8 px-4 sm:px-10 shadow-2xl rounded-2xl border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t("auth.fullName")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Dhinesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    fieldErrors.name ? "border-rose-300 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t("auth.username")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <span className="text-xs font-bold">@</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="dhinesh_builder"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    fieldErrors.username ? "border-rose-300 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
              </div>
              {fieldErrors.username && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t("auth.email")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="dhinesh@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    fieldErrors.email ? "border-rose-300 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t("auth.password")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    fieldErrors.password ? "border-rose-300 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t("auth.confirmPassword")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    fieldErrors.confirmPassword ? "border-rose-300 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? t("common.loading") : t("auth.registerButton")}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{t("auth.alreadyHaveAccount")}</span>
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              {t("auth.loginButton")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
