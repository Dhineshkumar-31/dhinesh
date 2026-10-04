"use client";

import React from "react";
import { LanguageProvider } from "@/lib/i18n/context";
import { ToastProvider } from "@/lib/context/ToastContext";
import { HouseProvider } from "@/lib/context/HouseContext";
import ExpenseModal from "@/components/expenses/ExpenseModal";
import CreateHouseModal from "@/components/house/CreateHouseModal";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <ToastProvider>
        <HouseProvider>
          {children}
          <ExpenseModal />
          <CreateHouseModal />
        </HouseProvider>
      </ToastProvider>
    </LanguageProvider>
  );
}
