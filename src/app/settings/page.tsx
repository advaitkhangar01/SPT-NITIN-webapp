"use client";

import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Building,
  FileSpreadsheet,
  Users,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Shield,
  Trash2,
  KeyRound,
} from "lucide-react";

interface SettingsData {
  companyName: string;
  displayName: string;
  tagline: string;
  gstNumber: string;
  phone: string;
  email: string;
  address: string;
  logoPath: string;
  quotationPrefix: string;
  invoicePrefix: string;
  nextQuotationNumber: number;
  nextInvoiceNumber: number;
  defaultValidityDays: number;
  defaultGst: number;
}

interface UserItem {
  id: string;
  name: string;
  username: string;
  role: string;
  mustChangePassword: boolean;
  createdAt: string;
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // New user form state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserUsername, setNewUserUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("STAFF");

  useEffect(() => {
    // Load current user, settings, and users list
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([userData, settingsData]) => {
        if (userData?.user) {
          setCurrentUser(userData.user);
          if (userData.user.role === "ADMIN") {
            fetch("/api/users")
              .then((r) => r.json())
              .then((d) => setUsers(d.users || []));
          }
        }
        if (settingsData?.settings) {
          setSettings(settingsData.settings);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSettingsChange = (field: keyof SettingsData, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");
      setMessage({ type: "success", text: "Settings saved successfully!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred" });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          username: newUserUsername,
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      setMessage({ type: "success", text: `User ${data.user.name} created!` });
      setShowAddUser(false);
      setNewUserName("");
      setNewUserUsername("");
      setNewUserPassword("");
      // refresh user list
      const uRes = await fetch("/api/users");
      const uData = await uRes.json();
      setUsers(uData.users || []);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user account for ${name}?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      setMessage({ type: "success", text: `User ${name} deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading || !settings) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-slate-400">
        Loading settings...
      </div>
    );
  }

  const isAdmin = currentUser?.role === "ADMIN";

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-[#0F4C81] flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#F37021]" />
          <span>APPLICATION & COMPANY SETTINGS</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure business details, document numbering sequences, and internal accounts
        </p>
      </div>

      {/* Alert Messages */}
      {message && (
        <div
          className={`p-3.5 rounded-md text-xs font-semibold flex items-center space-x-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
              : "bg-rose-50 text-rose-800 border border-rose-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {!isAdmin && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-md text-xs flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[#0F4C81] flex-shrink-0" />
          <span>
            You are logged in with Staff privileges. Staff can view details, but only Administrators can edit core company and document settings.
          </span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6 sm:space-y-8">
        {/* 1. Company Profile */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-[#0F4C81]" />
            <h2 className="text-sm font-black text-[#0F4C81] uppercase tracking-wide">
              1. Company Profile & Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Company Name
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.companyName}
                onChange={(e) => handleSettingsChange("companyName", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Template Display Brand
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.displayName}
                onChange={(e) => handleSettingsChange("displayName", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tagline
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.tagline}
                onChange={(e) => handleSettingsChange("tagline", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Number
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.gstNumber}
                onChange={(e) => handleSettingsChange("gstNumber", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100 font-mono font-bold text-[#F37021]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone / WhatsApp
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.phone}
                onChange={(e) => handleSettingsChange("phone", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email
              </label>
              <input
                type="email"
                disabled={!isAdmin}
                value={settings.email}
                onChange={(e) => handleSettingsChange("email", e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registered Address
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={settings.address}
              onChange={(e) => handleSettingsChange("address", e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100"
            />
          </div>

          <div className="pt-2 flex items-center space-x-4">
            <div className="w-16 h-16 bg-slate-100 border border-slate-300 rounded p-1 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.logoPath || "/logo.png"}
                alt="Brand Logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Official Logo Asset:</span>
              <p className="font-mono text-[11px] text-slate-600">/logo.png (Configured)</p>
              <p className="text-[10px] text-slate-400">
                The exact supplied emblem is bound to all generated quotations and invoices.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Document Numbering & Defaults */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <FileSpreadsheet className="w-5 h-5 text-[#0F4C81]" />
            <h2 className="text-sm font-black text-[#0F4C81] uppercase tracking-wide">
              2. Document Numbering & Defaults
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quotation Prefix
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.quotationPrefix}
                onChange={(e) => handleSettingsChange("quotationPrefix", e.target.value)}
                placeholder="QT-"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Quotation Sequence
              </label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.nextQuotationNumber}
                onChange={(e) =>
                  handleSettingsChange("nextQuotationNumber", Number(e.target.value))
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={settings.invoicePrefix}
                onChange={(e) => handleSettingsChange("invoicePrefix", e.target.value)}
                placeholder="INV-"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Invoice Sequence
              </label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.nextInvoiceNumber}
                onChange={(e) =>
                  handleSettingsChange("nextInvoiceNumber", Number(e.target.value))
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Quote Validity (Days)
              </label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.defaultValidityDays}
                onChange={(e) =>
                  handleSettingsChange("defaultValidityDays", Number(e.target.value))
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default GST Rate (%)
              </label>
              <input
                type="number"
                disabled={!isAdmin}
                value={settings.defaultGst}
                onChange={(e) =>
                  handleSettingsChange("defaultGst", Number(e.target.value))
                }
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none disabled:bg-slate-100"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="pt-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#0F4C81] hover:bg-[#164E87] text-white text-xs font-bold px-4 py-2.5 rounded shadow-sm flex items-center space-x-2 transition disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
              </button>
            </div>
          )}
        </div>
      </form>

      {/* 3. User Management (Admin Only) */}
      {isAdmin && (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-[#0F4C81]" />
              <h2 className="text-sm font-black text-[#0F4C81] uppercase tracking-wide">
                3. User Management
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddUser(!showAddUser)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddUser ? "Cancel" : "+ Add User"}</span>
            </button>
          </div>

          {showAddUser && (
            <form
              onSubmit={handleCreateUser}
              className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3"
            >
              <h3 className="text-xs font-bold text-slate-700 uppercase">
                Create New Internal User
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Ramesh Sharma"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    User ID / Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserUsername}
                    onChange={(e) => setNewUserUsername(e.target.value)}
                    placeholder="e.g. ramesh"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none font-semibold"
                  >
                    <option value="STAFF">STAFF</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#0F4C81] hover:bg-[#164E87] text-white text-xs font-bold px-4 py-2 rounded transition"
                >
                  Create Account
                </button>
              </div>
            </form>
          )}

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">
                      {u.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {u.username}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === "ADMIN"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {u.mustChangePassword ? (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          Temp Password
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {currentUser?.id !== u.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
