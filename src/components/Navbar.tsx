"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  Receipt,
  Settings as SettingsIcon,
  LogOut,
  PlusCircle,
  Menu,
  X,
  User as UserIcon,
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Automatically close mobile menu whenever pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Link */}
          <Link
            href="/quotations"
            className="flex items-center space-x-2 font-bold text-base sm:text-lg tracking-tight hover:opacity-95 transition min-w-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Logo"
              className="h-7 w-7 sm:h-8 sm:w-8 object-contain rounded-full bg-white p-0.5 flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-black tracking-wider leading-tight truncate">
                SHASHIKALAA POWER TECK
              </span>
              <span className="text-[8px] sm:text-[9px] text-slate-300 tracking-[0.12em] font-medium leading-tight truncate">
                QUOTATION & INVOICE MAKER
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Items (Hidden on Mobile) */}
          <nav className="hidden lg:flex items-center space-x-1.5 sm:space-x-2 text-xs font-semibold">
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

            {/* Settings */}
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

          {/* Desktop User & Logout */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            {user && (
              <div className="flex flex-col text-right">
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
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-blue-100 hover:text-white hover:bg-blue-800/60 transition focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-blue-800/70 bg-[#0c3f6c] px-4 py-4 space-y-4 shadow-xl">
          {/* Quick Create Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/quotations/new"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs font-bold text-center transition ${
                pathname === "/quotations/new"
                  ? "bg-[#F37021] text-white shadow"
                  : "bg-blue-900/80 text-blue-100 hover:bg-[#F37021] hover:text-white"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Quote</span>
            </Link>

            <Link
              href="/invoices/new"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs font-bold text-center transition ${
                pathname === "/invoices/new"
                  ? "bg-[#F37021] text-white shadow"
                  : "bg-blue-900/80 text-blue-100 hover:bg-[#F37021] hover:text-white"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Invoice</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col space-y-1 text-xs font-semibold">
            <Link
              href="/quotations"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition ${
                isActive("/quotations")
                  ? "bg-white/20 text-white font-bold"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Quotations Register</span>
            </Link>

            <Link
              href="/invoices"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition ${
                isActive("/invoices")
                  ? "bg-white/20 text-white font-bold"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Invoices Register</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition ${
                isActive("/settings")
                  ? "bg-white/20 text-white font-bold"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Settings & Profile</span>
            </Link>
          </nav>

          {/* User info & Logout */}
          <div className="pt-3 border-t border-blue-800/80 flex items-center justify-between text-xs">
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-800 flex items-center justify-center text-blue-200">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white text-xs leading-none">{user.name}</span>
                  <span className="text-[10px] text-blue-300 font-mono mt-0.5">{user.role}</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-blue-300">Logged in</span>
            )}

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-blue-900 hover:bg-rose-700 text-blue-100 hover:text-white rounded-md text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
