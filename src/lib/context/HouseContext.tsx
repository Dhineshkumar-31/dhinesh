"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

export interface HouseItem {
  id: string;
  name: string;
  ownerName: string;
  location: string;
  estimatedBudget: number;
  startDate: string;
  isDefault: boolean;
}

export interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  preferredLanguage: string;
  houses: HouseItem[];
}

interface HouseContextType {
  user: UserItem | null;
  houses: HouseItem[];
  activeHouse: HouseItem | null;
  loading: boolean;
  setActiveHouse: (house: HouseItem) => void;
  refreshUserData: () => Promise<void>;
  showCreateHouseModal: boolean;
  setShowCreateHouseModal: (show: boolean) => void;
  showExpenseModal: boolean;
  setShowExpenseModal: (show: boolean) => void;
  logout: () => Promise<void>;
}

const HouseContext = createContext<HouseContextType>({
  user: null,
  houses: [],
  activeHouse: null,
  loading: true,
  setActiveHouse: () => {},
  refreshUserData: async () => {},
  showCreateHouseModal: false,
  setShowCreateHouseModal: () => {},
  showExpenseModal: false,
  setShowExpenseModal: () => {},
  logout: async () => {},
});

export function HouseProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserItem | null>(null);
  const [houses, setHouses] = useState<HouseItem[]>([]);
  const [activeHouse, setActiveHouseState] = useState<HouseItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateHouseModal, setShowCreateHouseModal] = useState<boolean>(false);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);

  const refreshUserData = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          setUser(json.user);
          const houseList: HouseItem[] = json.user.houses || [];
          setHouses(houseList);

          const savedHouseId = localStorage.getItem("veetukanakku_active_house_id");
          let current = houseList.find((h) => h.id === savedHouseId);
          if (!current && houseList.length > 0) {
            current = houseList.find((h) => h.isDefault) || houseList[0];
          }

          if (current) {
            setActiveHouseState(current);
            localStorage.setItem("veetukanakku_active_house_id", current.id);
            setShowCreateHouseModal(false);
          } else if (
            houseList.length === 0 &&
            json.user.role !== "ADMIN" &&
            pathname !== "/" &&
            !pathname.startsWith("/login") &&
            !pathname.startsWith("/register") &&
            !pathname.startsWith("/forgot-password") &&
            !pathname.startsWith("/admin")
          ) {
            // Only prompt regular users when on user dashboard/app pages
            setShowCreateHouseModal(true);
          } else {
            setShowCreateHouseModal(false);
          }
        } else {
          setUser(null);
          setHouses([]);
          setActiveHouseState(null);
          setShowCreateHouseModal(false);
          setShowExpenseModal(false);
        }
      } else {
        setUser(null);
        setHouses([]);
        setActiveHouseState(null);
        setShowCreateHouseModal(false);
        setShowExpenseModal(false);
      }
    } catch (err) {
      console.error("Failed to load user session:", err);
      setUser(null);
      setHouses([]);
      setActiveHouseState(null);
      setShowCreateHouseModal(false);
      setShowExpenseModal(false);
    } finally {
      setLoading(false);
    }
  }, [pathname]);

  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);

  // When pathname changes to public/auth/admin pages, immediately close any house/expense modals
  useEffect(() => {
    if (
      pathname === "/" ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/admin")
    ) {
      setShowCreateHouseModal(false);
      setShowExpenseModal(false);
    }
  }, [pathname]);

  const setActiveHouse = (house: HouseItem) => {
    setActiveHouseState(house);
    localStorage.setItem("veetukanakku_active_house_id", house.id);
    fetch(`/api/houses/${house.id}/default`, { method: "POST" }).catch(() => {});
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setHouses([]);
    setActiveHouseState(null);
    setShowCreateHouseModal(false);
    setShowExpenseModal(false);
    localStorage.removeItem("veetukanakku_active_house_id");
  };

  return (
    <HouseContext.Provider
      value={{
        user,
        houses,
        activeHouse,
        loading,
        setActiveHouse,
        refreshUserData,
        showCreateHouseModal,
        setShowCreateHouseModal,
        showExpenseModal,
        setShowExpenseModal,
        logout,
      }}
    >
      {children}
    </HouseContext.Provider>
  );
}

export function useHouse() {
  return useContext(HouseContext);
}
