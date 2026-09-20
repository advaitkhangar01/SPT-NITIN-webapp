"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatIndianCurrency } from "@/lib/formatters";
import {
  Receipt,
  Search,
  Plus,
  Copy,
  FileDown,
  Trash2,
  ExternalLink,
  CheckCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
  createdBy: string;
  createdAt: string;
}

export default function InvoicesHistoryPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchInvoices = async (query = "", status = "ALL") => {
    try {
      setLoading(true);
      let url = `/api/invoices?q=${encodeURIComponent(query)}`;
      if (status !== "ALL") {
        url += `&status=${encodeURIComponent(status)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInvoices(search, statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // Duplicate invoice
  const handleDuplicate = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/invoices/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate");
      setMessage(`Invoice duplicated as ${data.invoice.invoiceNumber}`);
      fetchInvoices(search, statusFilter);
      setTimeout(() => {
        router.push(`/invoices/${data.invoice.id}`);
      }, 1000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark invoice as Paid
  const handleMarkPaid = async (id: string, totalAmount: number) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid: totalAmount,
          paymentStatus: "PAID",
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setMessage("Invoice marked as PAID");
      fetchInvoices(search, statusFilter);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete invoice
  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${number}?`)) return;
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete invoice");
      setMessage(`Invoice ${number} deleted.`);
      fetchInvoices(search, statusFilter);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-[#0F4C81] flex items-center space-x-2">
            <Receipt className="w-6 h-6 text-[#F37021]" />
            <span>INVOICES HISTORY</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Permanent register of all generated client tax invoices and billing records
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="inline-flex items-center space-x-2 bg-[#F37021] hover:bg-[#D95D14] text-white text-xs font-bold px-4 py-2.5 rounded-md shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Invoice</span>
        </Link>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-md flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Search & Status Filters */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or invoice number (e.g. Rajesh Patil, INV-2026-001)..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded bg-white font-medium outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY PAID">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#0F4C81] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">INVOICE NO</th>
                <th className="py-3 px-4">CUSTOMER</th>
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">TOTAL</th>
                <th className="py-3 px-4">AMOUNT PAID</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F4C81]" />
                    <span>Loading invoices...</span>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {search ? "No matching invoices found." : "No invoices created yet."}
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F4C81]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {inv.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.invoiceDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatIndianCurrency(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {formatIndianCurrency(inv.amountPaid)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.paymentStatus === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : inv.paymentStatus === "PARTIALLY PAID"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-1.5">
                        <Link
                          href={`/invoices/${inv.id}`}
                          title="View / Edit Invoice"
                          className="p-1.5 text-slate-600 hover:text-[#0F4C81] hover:bg-slate-100 rounded"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download PDF"
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                        >
                          <FileDown className="w-4 h-4" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(inv.id)}
                          disabled={actionLoadingId === inv.id}
                          title="Duplicate Invoice"
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {inv.paymentStatus !== "PAID" && (
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(inv.id, inv.totalAmount)}
                            disabled={actionLoadingId === inv.id}
                            title="Mark as Paid"
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                          disabled={actionLoadingId === inv.id}
                          title="Delete Invoice"
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
