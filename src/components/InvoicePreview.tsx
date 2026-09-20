"use client";

import React from "react";
import { formatIndianCurrency } from "@/lib/formatters";
import { CompanySnapshot } from "@/lib/company";
import { MapPin, Phone, Mail } from "lucide-react";

export interface InvoiceItemData {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
  amount: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerAddress?: string;
  customerMobile?: string;
  customerGst?: string;
  items: InvoiceItemData[];
  subtotal: number;
  gstAmount: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
  paymentMethod?: string;
  notes?: string;
}

interface InvoicePreviewProps {
  data: InvoiceData;
  company: CompanySnapshot;
  scale?: number;
}

export default function InvoicePreview({
  data,
  company,
  scale = 1,
}: InvoicePreviewProps) {
  const compName = company.displayName || "SHASHIKALAA POWER TECK";
  const tagline = company.tagline || "SOLAR & ENERGY SOLUTIONS";
  const gst = company.gstNumber || "27AJRPN3091N1ZE";
  const phone = company.phone || "+91 95271 61595";
  const email = company.email || "shashikalapowertech@gmail.com";
  const address =
    company.address ||
    "Plot No. 80, Shivaji colony, Behind Nasare Hall, Hudkeshwar Road, Nagpur-440034";
  const logo = company.logoPath || "/logo.png";

  const balanceDue = Math.max(0, (data.totalAmount || 0) - (data.amountPaid || 0));

  return (
    <div
      className="a4-document-container bg-white text-slate-800 shadow-2xl relative flex flex-col justify-between"
      style={{
        width: "210mm",
        minHeight: "297mm",
        height: "297mm",
        maxHeight: "297mm",
        padding: "12mm 16mm 10mm 16mm",
        boxSizing: "border-box",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top center",
      }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between relative pb-2">
          {/* Logo & Company Name */}
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 relative flex items-center justify-center flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo}
                alt={compName}
                className="max-h-16 max-w-16 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#0F4C81] leading-none uppercase font-sans">
                {compName}
              </h1>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-700 mt-1 uppercase font-sans">
                {tagline}
              </p>
            </div>
          </div>

          {/* Curved Orange GST Badge with Blue Sweep Line */}
          <div className="relative flex items-center">
            {/* Dark Blue Sweep Line SVG */}
            <svg
              className="absolute -bottom-2.5 -left-8 w-64 h-8 pointer-events-none z-0"
              viewBox="0 0 240 32"
              fill="none"
            >
              <path
                d="M 5 28 C 45 28, 65 6, 110 5 L 240 5"
                stroke="#0F4C81"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Orange Badge Container */}
            <div className="bg-[#F37021] text-white px-6 py-2.5 rounded-l-full shadow-xs flex items-center relative z-10 font-bold text-xs tracking-wider whitespace-nowrap">
              <span>GST No.: {gst}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full border-b border-slate-400 mt-1 mb-3"></div>

        {/* Invoice Header Badge & Dates */}
        <div className="flex items-center justify-between mb-3 bg-slate-50 p-2.5 rounded-sm border border-slate-200">
          <div>
            <span className="bg-[#0F4C81] text-white font-bold text-xs px-2.5 py-1 rounded tracking-wider uppercase">
              TAX INVOICE
            </span>
            <span className="ml-3 font-bold text-slate-900 text-sm">
              #{data.invoiceNumber || "INV-2026-001"}
            </span>
          </div>
          <div className="flex space-x-6 text-xs text-slate-700">
            <div>
              <span className="font-semibold text-slate-500">Invoice Date: </span>
              <span className="font-medium text-slate-900">{data.invoiceDate || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Due Date: </span>
              <span className="font-medium text-slate-900">{data.dueDate || "—"}</span>
            </div>
          </div>
        </div>

        {/* Bill To Card */}
        <div className="bg-[#F1F5F9] border-l-4 border-[#86EFAC] p-3 rounded-r-sm text-[11px] leading-relaxed shadow-sm mb-3">
          <h3 className="font-bold text-xs text-[#0F4C81] tracking-wide mb-1 uppercase">
            BILL TO / CUSTOMER DETAILS
          </h3>
          <div className="grid grid-cols-2 gap-4 text-slate-700">
            <div className="space-y-0.5">
              <p>
                <span className="font-semibold text-slate-800">Customer Name:</span>{" "}
                <span className="font-medium text-slate-900">{data.customerName || "—"}</span>
              </p>
              {data.customerAddress && (
                <p>
                  <span className="font-semibold text-slate-800">Address:</span>{" "}
                  <span>{data.customerAddress}</span>
                </p>
              )}
            </div>
            <div className="space-y-0.5">
              {data.customerMobile && (
                <p>
                  <span className="font-semibold text-slate-800">Mobile:</span>{" "}
                  <span>{data.customerMobile}</span>
                </p>
              )}
              {data.customerGst && (
                <p>
                  <span className="font-semibold text-slate-800">GSTIN:</span>{" "}
                  <span>{data.customerGst}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Line Items Table */}
        <div className="w-full overflow-hidden rounded-t-sm border border-slate-200">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0F4C81] text-white text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2 px-2.5 text-center w-[7%] border-r border-blue-800">#</th>
                <th className="py-2 px-3 w-[47%] border-r border-blue-800">DESCRIPTION</th>
                <th className="py-2 px-2.5 text-center w-[10%] border-r border-blue-800">QTY</th>
                <th className="py-2 px-3 text-right w-[14%] border-r border-blue-800">RATE</th>
                <th className="py-2 px-2 text-center w-[8%] border-r border-blue-800">GST</th>
                <th className="py-2 px-3 text-right w-[14%]">AMOUNT</th>
              </tr>
            </thead>
            <tbody className="text-[10.5px] divide-y divide-slate-200">
              {data.items && data.items.length > 0 ? (
                data.items.map((item, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                  >
                    <td className="py-2 px-2.5 text-center text-slate-700 font-semibold align-top">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 align-top">
                      <div className="font-semibold text-slate-800 text-[11px]">
                        {item.description}
                      </div>
                    </td>
                    <td className="py-2 px-2.5 text-center text-slate-700 font-medium align-top">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700 font-medium align-top">
                      {formatIndianCurrency(item.rate)}
                    </td>
                    <td className="py-2 px-2 text-center text-slate-700 font-medium align-top">
                      {item.gstRate}%
                    </td>
                    <td className="py-2 px-3 text-right text-slate-800 font-semibold align-top">
                      {formatIndianCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No items added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Calculation & Payment Summary */}
        <div className="mt-3 grid grid-cols-2 gap-4">
          {/* Left: Payment Status & Notes */}
          <div className="border border-slate-200 rounded p-2.5 bg-slate-50 text-[11px] flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-[#0F4C81] uppercase text-[10px] tracking-wider mb-1">
                PAYMENT DETAILS
              </h4>
              <div className="space-y-1 text-slate-700">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      data.paymentStatus === "PAID"
                        ? "bg-green-100 text-green-800"
                        : data.paymentStatus === "PARTIALLY PAID"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {data.paymentStatus || "UNPAID"}
                  </span>
                </div>
                {data.paymentMethod && (
                  <p>
                    <span className="font-semibold">Payment Method:</span>{" "}
                    <span>{data.paymentMethod}</span>
                  </p>
                )}
                {data.amountPaid > 0 && (
                  <p>
                    <span className="font-semibold">Amount Paid:</span>{" "}
                    <span>{formatIndianCurrency(data.amountPaid)}</span>
                  </p>
                )}
                {balanceDue > 0 && data.paymentStatus === "PARTIALLY PAID" && (
                  <p className="text-amber-700 font-semibold">
                    <span>Balance Due:</span>{" "}
                    <span>{formatIndianCurrency(balanceDue)}</span>
                  </p>
                )}
              </div>
            </div>
            {data.notes && (
              <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                <span className="font-semibold text-slate-700">Note:</span> {data.notes}
              </div>
            )}
          </div>

          {/* Right: Subtotal, GST, Discount, Total */}
          <div className="border border-slate-200 rounded p-2.5 bg-white text-[11px] space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium text-slate-800">
                {formatIndianCurrency(data.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST Total</span>
              <span className="font-medium text-slate-800">
                {formatIndianCurrency(data.gstAmount)}
              </span>
            </div>
            {data.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span className="font-medium">-{formatIndianCurrency(data.discount)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-[#15803D]">
              <span>Grand Total</span>
              <span className="text-base">{formatIndianCurrency(data.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-300 text-center">
        <div className="flex flex-col items-center justify-center space-y-1 text-[10.5px] text-slate-700">
          <div className="flex items-center justify-center space-x-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#F37021] flex-shrink-0" />
            <span>{address}</span>
          </div>
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-1">
              <Phone className="w-3.5 h-3.5 text-[#F37021] flex-shrink-0" />
              <span>{phone}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Mail className="w-3.5 h-3.5 text-[#F37021] flex-shrink-0" />
              <span>{email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
