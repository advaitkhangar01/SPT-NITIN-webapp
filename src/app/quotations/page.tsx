"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatIndianCurrency } from "@/lib/formatters";
import {
  FileText,
  Search,
  Plus,
  Copy,
  Receipt,
  FileDown,
  Trash2,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface QuotationSummary {
  id: string;
  quotationNumber: string;
  customerName: string;
  date: string;
  systemCapacity: string;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
}

export default function QuotationsHistoryPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<QuotationSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchQuotations = async (query = "") => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quotations${query ? `?q=${encodeURIComponent(query)}` : ""}`);
      const data = await res.json();
      if (res.ok) {
        setQuotations(data.quotations || []);
      }
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuotations(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Duplicate quotation
  const handleDuplicate = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/quotations/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to duplicate");
      setMessage(`Quotation duplicated as ${data.quotation.quotationNumber}`);
      fetchQuotations(search);
      setTimeout(() => {
        router.push(`/quotations/${data.quotation.id}`);
      }, 1000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Convert Quotation -> Invoice
  const handleCreateInvoice = async (id: string) => {
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/quotations/${id}/create-invoice`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");
      setMessage(`Tax Invoice ${data.invoice.invoiceNumber} created from quotation!`);
      setTimeout(() => {
        router.push(`/invoices/${data.invoice.id}`);
      }, 800);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete quotation
  const handleDelete = async (id: string, number: string) => {
    if (!confirm(`Are you sure you want to delete quotation ${number}?`)) return;
    try {
      setActionLoadingId(id);
      const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete quotation");
      setMessage(`Quotation ${number} deleted.`);
      fetchQuotations(search);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0F4C81] flex items-center space-x-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-[#F37021]" />
            <span>QUOTATIONS HISTORY</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Permanent register of all generated client solar quotations
          </p>
        </div>

        <Link
          href="/quotations/new"
          className="inline-flex items-center justify-center space-x-2 bg-[#F37021] hover:bg-[#D95D14] text-white text-xs font-bold px-4 py-2.5 rounded-md shadow-sm transition w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create New Quotation</span>
        </Link>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-md flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{message}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name or quotation number (e.g. Rajesh Patil, QT-2026-001)..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none"
          />
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#0F4C81] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">QUOTATION NO</th>
                <th className="py-3 px-4">CUSTOMER</th>
                <th className="py-3 px-4">DATE</th>
                <th className="py-3 px-4">CAPACITY</th>
                <th className="py-3 px-4">TOTAL</th>
                <th className="py-3 px-4">CREATED BY</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0F4C81]" />
                    <span>Loading quotations...</span>
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {search ? "No matching quotations found." : "No quotations created yet."}
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#0F4C81]">
                      {q.quotationNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {q.customerName}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{q.date}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {q.systemCapacity ? `${q.systemCapacity} kW` : "—"}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#15803D]">
                      {formatIndianCurrency(q.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {q.createdBy || "Admin"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1 sm:space-x-1.5">
                        <Link
                          href={`/quotations/${q.id}`}
                          title="View / Edit Quotation"
                          className="p-1.5 text-slate-600 hover:text-[#0F4C81] hover:bg-slate-100 rounded"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>

                        <a
                          href={`/api/quotations/${q.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="Download PDF"
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                        >
                          <FileDown className="w-4 h-4" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(q.id)}
                          disabled={actionLoadingId === q.id}
                          title="Duplicate Quotation"
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCreateInvoice(q.id)}
                          disabled={actionLoadingId === q.id}
                          title="Create Invoice from this Quote"
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded flex items-center space-x-1 shadow-xs"
                        >
                          <Receipt className="w-3 h-3" />
                          <span className="hidden sm:inline">Invoice</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(q.id, q.quotationNumber)}
                          disabled={actionLoadingId === q.id}
                          title="Delete Quotation"
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
