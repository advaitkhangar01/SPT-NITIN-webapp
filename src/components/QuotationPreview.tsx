"use client";

import React from "react";
import { formatIndianCurrency } from "@/lib/formatters";
import { CompanySnapshot } from "@/lib/company";
import {
  MapPin,
  Phone,
  Mail,
  User,
  Sun,
  Zap,
  Gauge,
  TrendingUp,
  Calendar,
  FileCheck,
  AlertCircle,
  FileText,
  CheckCircle2,
} from "lucide-react";

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
  showDocumentsRequired?: boolean;
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
    "Plot No. 80, Shivaji Colony, Behind Nasare Hall, Hudkeshwar Road, Nagpur-440034";
  const logo = company.logoPath || "/logo.png";
  const showDocs = data.showDocumentsRequired ?? true;

  return (
    <div
      className="a4-document-container bg-white text-slate-800 shadow-2xl relative flex flex-col justify-between overflow-hidden"
      style={{
        width: "210mm",
        minHeight: "297mm",
        height: "297mm",
        maxHeight: "297mm",
        padding: "10mm 15mm 9mm 15mm",
        boxSizing: "border-box",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top center",
      }}
    >
      {/* Top-Right Completely Filled Background Graphic with Perfectly Centered GST */}
      <svg
        className="absolute top-0 right-0 w-[440px] h-[75px] pointer-events-none z-0"
        viewBox="0 0 440 75"
        fill="none"
      >
        <defs>
          <linearGradient id="gstNavyFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F4C81" />
            <stop offset="100%" stopColor="#072b4c" />
          </linearGradient>
          <linearGradient id="gstOrangeFill" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F37021" />
            <stop offset="100%" stopColor="#DE5509" />
          </linearGradient>
        </defs>

        {/* Navy Blue Base Curve (Completely Filled) */}
        <path
          d="M 60 72 C 140 75 220 72 320 62 L 440 55 L 440 0 L 160 0 C 130 25 90 50 60 72 Z"
          fill="url(#gstNavyFill)"
        />

        {/* Gold Solar Accent Ribbon (Completely Filled) */}
        <path
          d="M 85 64 C 150 66 225 64 320 54 L 440 48 L 440 0 L 175 0 C 145 22 110 44 85 64 Z"
          fill="#FBBF24"
        />

        {/* Vibrant Solar Orange Main Body (Completely Filled) */}
        <path
          d="M 95 60 C 155 62 230 60 320 50 L 440 45 L 440 0 L 180 0 C 152 20 118 40 95 60 Z"
          fill="url(#gstOrangeFill)"
        />

        {/* Perfectly Centered GST Number Inside Orange Banner */}
        <text
          x="310"
          y="27"
          fill="#ffffff"
          fontSize="11.5"
          fontWeight="900"
          letterSpacing="0.08em"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {`GST No.: ${gst}`}
        </text>
      </svg>

      {/* Top Header Section */}
      <div className="relative z-10">
        {/* Main Header with Logo and Title */}
        <div className="flex items-center justify-between relative pb-1 pt-0.5">
          {/* Logo & Company Name */}
          <div className="flex items-center space-x-3.5">
            <div className="w-[72px] h-[72px] relative flex items-center justify-center flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo}
                alt={compName}
                className="max-h-[72px] max-w-[72px] object-contain drop-shadow-sm"
              />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-[23px] font-black tracking-tight text-[#0F4C81] leading-none uppercase font-sans">
                  {compName}
                </h1>
              </div>
              <p className="text-[10.5px] font-bold tracking-[0.22em] text-slate-600 mt-1 uppercase font-sans flex items-center gap-1">
                <Sun className="w-3 h-3 text-[#F37021]" />
                <span>{tagline}</span>
              </p>
              <p className="text-[9.5px] font-medium text-slate-500 tracking-wide mt-0.5">
                MNRE Empaneled Rooftop Solar EPC & Engineering Services
              </p>
            </div>
          </div>

          {/* Right Spacer for Graphic Banner */}
          <div className="w-64 h-12 flex-shrink-0"></div>
        </div>

        {/* Divider */}
        <div className="w-full border-b border-slate-300 mt-1.5 mb-2"></div>

        {/* Document Reference Bar (Quotation Ref & Issue Date) */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2.5 px-1">
          <div className="flex items-center space-x-2">
            <span className="bg-[#0F4C81] text-white text-[9.5px] font-black px-2 py-0.5 rounded tracking-wider uppercase">
              QUOTATION
            </span>
            <span className="text-[11px] font-bold text-slate-800 flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-[#0F4C81]" />
              <span>Ref: {data.quotationNumber || "QT-2026-001"}</span>
            </span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-[#F37021]" />
            <span className="font-semibold">Date:</span>
            <span className="font-bold text-slate-900">{data.date || "20/09/2026"}</span>
          </div>
        </div>

        {/* Information Cards (Two Columns with Icons) */}
        <div className="grid grid-cols-2 gap-3.5 mb-2.5">
          {/* Left Card: Customer Details */}
          <div className="bg-[#F8FAFC] border-l-[3.5px] border-[#0F4C81] p-2.5 px-3 rounded-r-md text-[10.5px] leading-relaxed shadow-2xs border-y border-r border-slate-200/70">
            <div className="flex items-center space-x-1.5 mb-1.5 pb-1 border-b border-slate-200">
              <User className="w-3.5 h-3.5 text-[#0F4C81]" />
              <h3 className="font-extrabold text-[10.5px] text-[#0F4C81] tracking-wider uppercase">
                CUSTOMER DETAILS
              </h3>
            </div>
            <div className="space-y-1 text-slate-700">
              <p className="flex items-start">
                <span className="font-semibold text-slate-800 w-28 flex-shrink-0">
                  Customer Name:
                </span>
                <span className="font-bold text-slate-900 truncate">
                  {data.customerName || "—"}
                </span>
              </p>
              <p className="flex items-start">
                <span className="font-semibold text-slate-800 w-28 flex-shrink-0">
                  Proposed System:
                </span>
                <span className="text-slate-800 font-medium">
                  {data.proposedSystem || "On-Grid Rooftop Solar"}
                </span>
              </p>
              <p className="flex items-start">
                <span className="font-semibold text-slate-800 w-28 flex-shrink-0">
                  Connection Type:
                </span>
                <span className="text-slate-800 font-medium">
                  {data.connectionType || "LT 1-Phase Grid Connected"}
                </span>
              </p>
            </div>
          </div>

          {/* Right Card: Project Summary */}
          <div className="bg-[#F8FAFC] border-l-[3.5px] border-[#F37021] p-2.5 px-3 rounded-r-md text-[10.5px] leading-relaxed shadow-2xs border-y border-r border-slate-200/70">
            <div className="flex items-center space-x-1.5 mb-1.5 pb-1 border-b border-slate-200">
              <Gauge className="w-3.5 h-3.5 text-[#F37021]" />
              <h3 className="font-extrabold text-[10.5px] text-[#F37021] tracking-wider uppercase">
                PROJECT SUMMARY
              </h3>
            </div>
            <div className="space-y-1 text-slate-700">
              <p className="flex items-start">
                <span className="font-semibold text-slate-800 w-32 flex-shrink-0">
                  System Capacity:
                </span>
                <span className="font-bold text-slate-900">
                  {data.systemCapacity ? `${data.systemCapacity} kW Grid-Tied` : "—"}
                </span>
              </p>
              <p className="flex items-start">
                <span className="font-semibold text-slate-800 w-32 flex-shrink-0">
                  Estimated Generation:
                </span>
                <span className="text-slate-800 font-medium">
                  {data.estimatedGeneration
                    ? `${data.estimatedGeneration} Units / Day`
                    : "—"}
                </span>
              </p>
              <p className="flex items-start">
                <span className="font-semibold text-slate-800 w-32 flex-shrink-0">
                  Quote Validity:
                </span>
                <span className="text-slate-800 font-medium">
                  {data.validityDays ? `${data.validityDays} Days` : "15 Days"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Section Heading */}
        <div className="mt-2.5 mb-1.5 flex items-center justify-between">
          <h2 className="text-[10.5px] font-black text-[#0F4C81] tracking-wider uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#F37021]" />
            <span>BILL OF MATERIALS & SYSTEM SPECIFICATIONS</span>
          </h2>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Tier-1 Components
          </span>
        </div>

        {/* Bill of Materials Table */}
        <div className="w-full overflow-hidden rounded-t-sm border border-slate-300">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gradient-to-r from-[#0F4C81] to-[#16568F] text-white text-[9.5px] uppercase font-bold tracking-wider">
                <th className="py-1.5 px-2.5 text-center w-[6%] border-r border-blue-800">#</th>
                <th className="py-1.5 px-3 w-[48%] border-r border-blue-800">
                  COMPONENT & SPECIFICATIONS
                </th>
                <th className="py-1.5 px-3 w-[24%] border-r border-blue-800">BRAND / MODEL</th>
                <th className="py-1.5 px-3 w-[22%]">QUANTITY</th>
              </tr>
            </thead>
            <tbody className="text-[10px] divide-y divide-slate-200">
              {data.items && data.items.length > 0 ? (
                data.items.map((item, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"}
                  >
                    <td className="py-1.5 px-2.5 text-center text-slate-700 font-bold align-top">
                      <span className="inline-block w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[9px] leading-4 text-center">
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 align-top">
                      <div className="font-bold text-slate-800 text-[10.5px]">
                        {item.component}
                      </div>
                      {item.specification && (
                        <div className="text-slate-500 text-[9.5px] mt-0.5 leading-snug">
                          {item.specification}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-slate-700 font-medium align-top">
                      {item.brandModel || "—"}
                    </td>
                    <td className="py-1.5 px-3 text-slate-800 font-semibold align-top">
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
        <div className="mt-2.5 bg-gradient-to-r from-[#ECFDF5] to-[#E8F7EC] border-2 border-[#86EFAC] rounded-md p-2.5 px-4 flex items-center justify-between shadow-2xs">
          <div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
              <h4 className="text-sm font-black text-[#15803D] tracking-tight uppercase">
                Total Project Investment
              </h4>
            </div>
            <p className="text-[9.5px] text-slate-600 mt-0.5">
              {data.investmentNote ||
                "Includes all materials, transport, installation & net-metering support."}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[20px] font-black text-[#15803D] tracking-tight leading-none">
              {formatIndianCurrency(data.totalAmount)}
            </div>
            {data.gstInclusive && (
              <p className="text-[9.5px] text-slate-600 font-bold mt-0.5">
                (Inclusive of GST & All Taxes)
              </p>
            )}
          </div>
        </div>

        {/* Documents Required for Solar Application Section */}
        {showDocs && (
          <div className="mt-2.5 border border-blue-200/90 rounded-md p-2.5 px-3 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] shadow-2xs">
            {/* Header with Title and Subsidy Tag */}
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
              <div className="flex items-center space-x-1.5">
                <FileCheck className="w-4 h-4 text-[#0F4C81]" />
                <h3 className="font-black text-[11px] text-[#0F4C81] tracking-wider uppercase">
                  DOCUMENTS REQUIRED FOR SOLAR APPLICATION
                </h3>
              </div>
              <span className="text-[8.5px] font-bold text-[#0F4C81] bg-blue-100/80 px-2 py-0.5 rounded border border-blue-300/60 uppercase tracking-wider">
                Subsidy & Net-Metering Checklist
              </span>
            </div>

            {/* 6-Item Checklist Grid (2 Columns x 3 Rows) */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
              {/* Item 1 */}
              <div className="flex items-center space-x-2 bg-white/90 border border-slate-200 rounded px-2 py-1 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  1
                </span>
                <span className="font-bold text-slate-800">Latest Electricity Bill</span>
              </div>

              {/* Item 2 */}
              <div className="flex items-center space-x-2 bg-white/90 border border-slate-200 rounded px-2 py-1 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  2
                </span>
                <span className="font-bold text-slate-800">Tax Receipt / Sale Deed</span>
              </div>

              {/* Item 3 */}
              <div className="flex items-center space-x-2 bg-white/90 border border-slate-200 rounded px-2 py-1 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  3
                </span>
                <span className="font-bold text-slate-800">Aadhar Card</span>
              </div>

              {/* Item 4 */}
              <div className="flex items-center space-x-2 bg-white/90 border border-slate-200 rounded px-2 py-1 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  4
                </span>
                <span className="font-bold text-slate-800">Passport size Photo (2 Nos.)</span>
              </div>

              {/* Item 5 */}
              <div className="flex items-center space-x-2 bg-white/90 border border-slate-200 rounded px-2 py-1 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  5
                </span>
                <span className="font-bold text-slate-800 leading-tight">
                  Canceled Cheque{" "}
                  <span className="text-[9px] font-semibold text-emerald-700">
                    (Subsidy Amount Will be Credited on Account)
                  </span>
                </span>
              </div>

              {/* Item 6 */}
              <div className="flex items-center space-x-2 bg-white/90 border border-slate-200 rounded px-2 py-1 shadow-2xs">
                <span className="w-4 h-4 rounded-full bg-[#0F4C81] text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                  6
                </span>
                <span className="font-bold text-slate-800 leading-tight">
                  A-1 Application Form{" "}
                  <span className="text-[9px] font-medium text-slate-500">
                    (Load Extension)
                  </span>
                </span>
              </div>
            </div>

            {/* Red Note Alert Callout */}
            <div className="mt-2 bg-amber-50/90 border border-amber-300/80 rounded px-2.5 py-1 flex items-center space-x-1.5 text-[10px]">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
              <p className="text-slate-700 font-medium">
                <span className="font-black text-rose-600 uppercase">Note:</span> Load
                extension Demand charges will be paid by consumer.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="pt-3 border-t-2 border-slate-200 text-center">
        <div className="flex flex-col items-center justify-center space-y-1 text-[10px] text-slate-700">
          <div className="flex items-center justify-center space-x-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#F37021] flex-shrink-0" />
            <span>{address}</span>
          </div>
          <div className="flex items-center justify-center space-x-6 pt-0.5">
            <div className="flex items-center space-x-1 font-bold text-slate-800">
              <Phone className="w-3.5 h-3.5 text-[#F37021] flex-shrink-0" />
              <span>{phone}</span>
            </div>
            <div className="flex items-center space-x-1 font-medium text-slate-700">
              <Mail className="w-3.5 h-3.5 text-[#F37021] flex-shrink-0" />
              <span>{email}</span>
            </div>
          </div>
          <p className="text-[8.5px] text-slate-400 font-medium tracking-wider uppercase pt-0.5">
            Clean Energy for a Greener Tomorrow • Authorized Solar EPC Partner
          </p>
        </div>
      </div>
    </div>
  );
}
