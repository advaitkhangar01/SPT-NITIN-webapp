"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  Receipt,
  History,
  Settings as SettingsIcon,
  LogOut,
  PlusCircle,
  ShieldAlert,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  username: string;
  role: string;
  mustChangePassword: boolean;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          if (data.user.mustChangePassword && pathname !== "/change-password") {
            router.push("/change-password");
          }
        }
      })
      .catch(() => {});
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const isActive = (path: string) => {
    if (path === "/quotations" && (pathname === "/quotations" || pathname.startsWith("/quotations/"))) {
      if (pathname === "/quotations/new") return false;
      return true;
    }
    if (path === "/invoices" && (pathname === "/invoices" || pathname.startsWith("/invoices/"))) {
      if (pathname === "/invoices/new") return false;
      return true;
    }
    return pathname === path;
  };

  if (pathname?.includes("/print")) {
    return null;
  }

  return (
    <header className="no-print bg-[#0F4C81] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Link */}
          <Link
            href="/quotations"
            className="flex items-center space-x-2.5 font-bold text-lg tracking-tight hover:opacity-95 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Logo"
              className="h-8 w-8 object-contain rounded-full bg-white p-0.5"
            />
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-wider leading-none">
                SHASHIKALAA POWER TECK
              </span>
              <span className="text-[9px] text-slate-300 tracking-[0.15em] font-medium leading-tight">
                QUOTATION & INVOICE MAKER
              </span>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="flex items-center space-x-1 sm:space-x-2 text-xs font-semibold">
            {/* Create Actions */}
            <div className="flex items-center bg-blue-900/60 rounded-md p-0.5 border border-blue-700/50">
              <Link
                href="/quotations/new"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition ${
                  pathname === "/quotations/new"
                    ? "bg-[#F37021] text-white shadow-sm"
                    : "text-blue-100 hover:text-white hover:bg-blue-800/60"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ New Quote</span>
              </Link>

              <Link
                href="/invoices/new"
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition ${
                  pathname === "/invoices/new"
                    ? "bg-[#F37021] text-white shadow-sm"
                    : "text-blue-100 hover:text-white hover:bg-blue-800/60"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ New Invoice</span>
              </Link>
            </div>

            {/* History Links */}
            <Link
              href="/quotations"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition ${
                isActive("/quotations")
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Quotations</span>
            </Link>

            <Link
              href="/invoices"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition ${
                isActive("/invoices")
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Invoices</span>
            </Link>

            {/* Settings (Admin gets indicator) */}
            <Link
              href="/settings"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition ${
                isActive("/settings")
                  ? "bg-white/15 text-white"
                  : "text-blue-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span>Settings</span>
            </Link>
          </nav>

          {/* User & Logout */}
          <div className="flex items-center space-x-3 text-xs">
            {user && (
              <div className="hidden md:flex flex-col text-right">
                <span className="font-semibold text-slate-100">{user.name}</span>
                <span className="text-[10px] text-blue-200 uppercase tracking-wider font-mono">
                  {user.role}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-800/80 rounded transition flex items-center space-x-1 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
