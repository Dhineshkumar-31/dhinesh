"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/context";
import { useHouse } from "@/lib/context/HouseContext";
import { useToast } from "@/lib/context/ToastContext";
import {
  Building2,
  ChevronDown,
  Languages,
  LogOut,
  User,
  PlusCircle,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";

export default function Navbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const { locale, setLocale, t } = useLanguage();
  const { user, houses, activeHouse, setActiveHouse, setShowCreateHouseModal, refreshUserData, logout } = useHouse();
  const { success } = useToast();
  const router = useRouter();

  const [houseDropdownOpen, setHouseDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.replace("/");
    } catch (err) {
      console.error("Logout failed:", err);
      window.location.replace("/");
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition shrink-0"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link href="/dashboard" className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition shrink-0">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 leading-tight text-base sm:text-lg flex items-center gap-1.5">
              <span>{t("common.appName")}</span>
              <span className="hidden xs:inline-flex text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">PRO</span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block truncate max-w-[260px] md:max-w-none">
              {locale === "ta" ? "உங்கள் கட்டுமான செலவுகளை எளிதாக நிர்வகிக்கவும்." : "Build Smarter. Track Every Expense."}
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* House Switcher Dropdown */}
        {user && houses.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setHouseDropdownOpen(!houseDropdownOpen)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-medium text-slate-700 transition"
              title={activeHouse?.name || t("house.title")}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <span className="max-w-[70px] xs:max-w-[110px] sm:max-w-[180px] truncate">
                {activeHouse?.name || t("house.title")}
              </span>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
            </button>

            {houseDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setHouseDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl z-50 py-1.5 text-sm animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    {t("house.switchHouse")}
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {houses.map((h) => (
                      <button
                        key={h.id}
                        onClick={() => {
                          setActiveHouse(h);
                          setHouseDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 transition ${
                          activeHouse?.id === h.id ? "font-semibold text-blue-600 bg-blue-50/50" : "text-slate-700"
                        }`}
                      >
                        <span className="truncate">{h.name}</span>
                        {activeHouse?.id === h.id && <span className="text-xs text-blue-600">✓</span>}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setHouseDropdownOpen(false);
                        setShowCreateHouseModal(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{t("house.createNew")}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Language Switcher Button (English | தமிழ்) */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] sm:text-xs font-semibold">
          <button
            onClick={() => setLocale("en")}
            className={`px-1.5 sm:px-2.5 py-1 rounded-md transition ${
              locale === "en" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLocale("ta")}
            className={`px-1.5 sm:px-2.5 py-1 rounded-md transition ${
              locale === "ta" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            தமிழ்
          </button>
        </div>

        {/* User Profile / Logout */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
              aria-label="User menu"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                {user.name.charAt(0)}
              </div>
              <span className="text-xs sm:text-sm font-medium text-slate-800 hidden md:inline max-w-[100px] truncate">
                {user.name}
              </span>
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 hidden sm:inline" />
            </button>

            {userDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-xl z-50 py-1.5 text-sm animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                    {user.role === "ADMIN" && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <ShieldAlert className="w-3 h-3" /> Administrator
                      </span>
                    )}
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{t("common.profile")}</span>
                  </Link>

                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-amber-700 hover:bg-amber-50 font-medium transition"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>{t("common.admin")}</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>{t("common.logout")}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 transition"
            >
              {t("common.login")}
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-xs"
            >
              {t("common.register")}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
