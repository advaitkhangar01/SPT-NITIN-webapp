import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatIndianCurrency } from "@/lib/formatters";
import { FileText, Receipt, PlusCircle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recentQuotations = await prisma.quotation.findMany({
    take: 4,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      quotationNumber: true,
      customerName: true,
      date: true,
      totalAmount: true,
    },
  });

  const recentInvoices = await prisma.invoice.findMany({
    take: 4,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      invoiceNumber: true,
      customerName: true,
      invoiceDate: true,
      totalAmount: true,
      paymentStatus: true,
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F4C81] to-[#164E87] rounded-xl p-8 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-block bg-[#F37021] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
            Quick Action Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wide font-sans">
            SHASHIKALAA POWER TECK
          </h1>
          <p className="text-xs text-blue-200 tracking-wider">
            SOLAR & ENERGY SOLUTIONS • QUOTATION & INVOICE SYSTEM
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link
            href="/quotations/new"
            className="flex items-center justify-center space-x-2 bg-[#F37021] hover:bg-[#D95D14] text-white font-bold px-5 py-3 rounded-lg shadow-sm transition text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ NEW QUOTATION</span>
          </Link>

          <Link
            href="/invoices/new"
            className="flex items-center justify-center space-x-2 bg-white hover:bg-slate-100 text-[#0F4C81] font-bold px-5 py-3 rounded-lg shadow-sm transition text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ NEW INVOICE</span>
          </Link>
        </div>
      </div>

      {/* Two History Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Quotations */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-[#0F4C81]" />
              <h2 className="text-sm font-black text-[#0F4C81] uppercase tracking-wide">
                Recent Quotations
              </h2>
            </div>
            <Link
              href="/quotations"
              className="text-xs font-semibold text-[#F37021] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentQuotations.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No quotations created yet. Click above to create one.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentQuotations.map((q) => (
                <div
                  key={q.id}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-1 rounded transition"
                >
                  <div>
                    <Link
                      href={`/quotations/${q.id}`}
                      className="font-bold text-[#0F4C81] hover:underline"
                    >
                      {q.quotationNumber}
                    </Link>
                    <span className="text-slate-700 ml-2 font-medium">
                      {q.customerName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#15803D]">
                      {formatIndianCurrency(q.totalAmount)}
                    </span>
                    <span className="text-slate-400 text-[11px] block">{q.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-[#0F4C81]" />
              <h2 className="text-sm font-black text-[#0F4C81] uppercase tracking-wide">
                Recent Invoices
              </h2>
            </div>
            <Link
              href="/invoices"
              className="text-xs font-semibold text-[#F37021] hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No invoices created yet. Click above to create one.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-1 rounded transition"
                >
                  <div>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-bold text-[#0F4C81] hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                    <span className="text-slate-700 ml-2 font-medium">
                      {inv.customerName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">
                      {formatIndianCurrency(inv.totalAmount)}
                    </span>
                    <span
                      className={`text-[10px] font-bold block ${
                        inv.paymentStatus === "PAID"
                          ? "text-emerald-700"
                          : inv.paymentStatus === "PARTIALLY PAID"
                          ? "text-amber-700"
                          : "text-rose-700"
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
