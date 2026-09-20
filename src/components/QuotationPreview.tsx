"use client";

import React from "react";
import { formatIndianCurrency } from "@/lib/formatters";
import { CompanySnapshot } from "@/lib/company";
import { MapPin, Phone, Mail } from "lucide-react";

export interface QuotationItemData {
  id?: string;
  component: string;
  specification: string;
  brandModel: string;
  quantity: string;
}

export interface QuotationData {
  quotationNumber: string;
  date: string;
  customerName: string;
  proposedSystem: string;
  connectionType: string;
  systemCapacity: string;
  estimatedGeneration: string;
  validityDays: number;
  items: QuotationItemData[];
  totalAmount: number;
  gstInclusive: boolean;
  investmentNote?: string;
}

interface QuotationPreviewProps {
  data: QuotationData;
  company: CompanySnapshot;
  scale?: number;
}

export default function QuotationPreview({
  data,
  company,
  scale = 1,
}: QuotationPreviewProps) {
  // Use company snapshot or fallback values
  const compName = company.displayName || "SHASHIKALAA POWER TECK";
  const tagline = company.tagline || "SOLAR & ENERGY SOLUTIONS";
  const gst = company.gstNumber || "27AJRPN3091N1ZE";
  const phone = company.phone || "+91 95271 61595";
  const email = company.email || "shashikalapowertech@gmail.com";
  const address =
    company.address ||
    "Plot No. 80, Shivaji colony, Behind Nasare Hall, Hudkeshwar Road, Nagpur-440034";
  const logo = company.logoPath || "/logo.png";

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
      {/* Top Header Section */}
      <div>
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
        <div className="w-full border-b border-slate-400 mt-1 mb-2"></div>

        {/* Date line right-aligned */}
        <div className="flex justify-end text-xs font-semibold text-slate-700 mb-2 pr-2">
          <span>Date: {data.date || "20/09/2026"}</span>
        </div>

        {/* Information Cards (Two Columns) */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          {/* Left Card: Customer Details */}
          <div className="bg-[#F1F5F9] border-l-4 border-[#86EFAC] p-3 rounded-r-sm text-[11px] leading-relaxed shadow-sm">
            <h3 className="font-bold text-xs text-[#0F4C81] tracking-wide mb-1 uppercase">
              CUSTOMER DETAILS
            </h3>
            <div className="space-y-0.5 text-slate-700">
              <p>
                <span className="font-semibold text-slate-800">Customer Name:</span>{" "}
                <span className="font-medium text-slate-900">{data.customerName || "—"}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-800">Proposed System:</span>{" "}
                <span>{data.proposedSystem || "On-Grid Rooftop Solar"}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-800">Connection Type:</span>{" "}
                <span>{data.connectionType || "LT 1-Phase Grid Connected"}</span>
              </p>
            </div>
          </div>

          {/* Right Card: Project Summary */}
          <div className="bg-[#F1F5F9] border-l-4 border-[#86EFAC] p-3 rounded-r-sm text-[11px] leading-relaxed shadow-sm">
            <h3 className="font-bold text-xs text-[#0F4C81] tracking-wide mb-1 uppercase">
              PROJECT SUMMARY
            </h3>
            <div className="space-y-0.5 text-slate-700">
              <p>
                <span className="font-semibold text-slate-800">System Capacity:</span>{" "}
                <span>{data.systemCapacity ? `${data.systemCapacity} kW Grid-Tied` : "—"}</span>
              </p>
              <p>
                <span className="font-semibold text-slate-800">Estimated Generation:</span>{" "}
                <span>
                  {data.estimatedGeneration ? `${data.estimatedGeneration} Units / Day` : "—"}
                </span>
              </p>
              <p>
                <span className="font-semibold text-slate-800">Quote Validity:</span>{" "}
                <span>{data.validityDays ? `${data.validityDays} Days` : "15 Days"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Section Heading */}
        <div className="mt-3 mb-1.5">
          <h2 className="text-[11px] font-bold text-slate-700 tracking-wider uppercase">
            BILL OF MATERIALS & SYSTEM SPECIFICATIONS
          </h2>
        </div>

        {/* Bill of Materials Table */}
        <div className="w-full overflow-hidden rounded-t-sm border border-slate-200">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#0F4C81] text-white text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2 px-2.5 text-center w-[7%] border-r border-blue-800">#</th>
                <th className="py-2 px-3 w-[47%] border-r border-blue-800">
                  COMPONENT & SPECIFICATIONS
                </th>
                <th className="py-2 px-3 w-[24%] border-r border-blue-800">BRAND / MODEL</th>
                <th className="py-2 px-3 w-[22%]">QUANTITY</th>
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
                      <div className="font-bold text-slate-800 text-[11px]">
                        {item.component}
                      </div>
                      {item.specification && (
                        <div className="text-slate-500 text-[10px] mt-0.5 leading-tight">
                          {item.specification}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-medium align-top">
                      {item.brandModel || "—"}
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-medium align-top">
                      {item.quantity || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400">
                    No components added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total Project Investment Section */}
        <div className="mt-3 bg-[#E8F7EC] border border-[#86EFAC] rounded-md p-3 px-4 flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-[#15803D] tracking-tight">
              Total Project Investment
            </h4>
            <p className="text-[10px] text-slate-600 mt-0.5">
              {data.investmentNote ||
                "Includes all materials, transport, installation & net-metering support."}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-[#15803D] tracking-tight">
              {formatIndianCurrency(data.totalAmount)}
            </div>
            {data.gstInclusive && (
              <p className="text-[10px] text-slate-600 font-medium mt-0.5">
                (Inclusive of GST & All Taxes)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Section (Matches Reference) */}
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
