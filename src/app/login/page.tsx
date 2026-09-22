"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, AlertCircle, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/quotations";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.user?.mustChangePassword) {
        router.push("/change-password");
      } else {
        router.push(from);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Brand Banner */}
      <div className="bg-[#0F4C81] p-6 text-center text-white relative">
        <div className="w-20 h-20 mx-auto mb-3 bg-white rounded-2xl p-2 shadow-md flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Shashikala Power Teck"
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <h1 className="text-xl font-black tracking-wider uppercase">
          SHASHIKALAA POWER TECK
        </h1>
        <p className="text-xs font-semibold tracking-widest text-blue-200 uppercase mt-0.5">
          SOLAR & ENERGY SOLUTIONS
        </p>
        <div className="mt-2 text-[10px] text-blue-100/70 font-mono tracking-wide">
          QUOTATION & INVOICE SYSTEM
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            User ID
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. nitin"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-[#0F4C81] focus:border-transparent outline-none transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-[#0F4C81] hover:bg-[#164E87] text-white font-bold py-2.5 px-4 rounded-md text-sm transition shadow flex items-center justify-center space-x-2 disabled:opacity-60"
        >
          <span>{loading ? "Verifying..." : "LOGIN"}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-2 text-center text-slate-400 text-[11px]">
          Internal business utility • Shashikala Power Tech
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-slate-400">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
