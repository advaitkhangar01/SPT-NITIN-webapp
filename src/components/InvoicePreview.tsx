"use client";

import React from "react";
import { formatIndianCurrency, convertNumberToWords } from "@/lib/formatters";
import { CompanySnapshot, sanitizeBusinessEmail } from "@/lib/company";

export interface InvoiceItemData {
  id?: string;
  description: string;
  quantity: number;
  rate: number;
  gstRate: number;
  amount: number;
  per?: string;
  hsn?: string;
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
  refNo?: string;
  buyerOrderNo?: string;
  termsOfDelivery?: string;
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
  const compName = company.displayName || "SHASHIKALA POWER TECH";
  const tagline = company.tagline || "SOLAR & ENERGY SOLUTIONS";
  const gst = company.gstNumber || "27AJRPN3091N1ZE";
  const phone = company.phone || "+91 95271 61595";
  const email = sanitizeBusinessEmail(company.email);
  const address =
    company.address ||
    "Plot No. 80, Shivaji Colony, Behind Nasare Hall, Hudkeshwar Road, Nagpur-440034";
  const logo = company.logoPath || "/logo.png";

  // Calculate GST breakdown (50% CGST + 50% SGST standard intra-state)
  const totalGst = Math.round((Number(data.gstAmount) || 0) * 100) / 100;
  const cgstAmount = Math.round((totalGst / 2) * 100) / 100;
  const sgstAmount = Math.round((totalGst - cgstAmount) * 100) / 100;
  const subtotal = Math.round((Number(data.subtotal) || 0) * 100) / 100;
  const discount = Math.round((Number(data.discount) || 0) * 100) / 100;
  const totalAmount = Math.round((Number(data.totalAmount) || Math.max(0, subtotal + totalGst - discount)) * 100) / 100;
  const amountPaid = Math.round((Number(data.amountPaid) || 0) * 100) / 100;
  const balanceDue = Math.max(0, Math.round((totalAmount - amountPaid) * 100) / 100);

  const effectiveGstPercent =
    subtotal > 0
      ? Math.round((totalGst / subtotal) * 100)
      : 18;
  const halfGstPercent = (effectiveGstPercent / 2).toFixed(1).replace(/\.0$/, "");

  const itemCount = data.items?.length || 0;
  const isDense = itemCount > 4;
  const isSuperDense = itemCount > 7;

  return (
    <div
      className="a4-document-container bg-white text-[#1A1A1A] shadow-2xl relative print:shadow-none"
      style={{
        boxSizing: "border-box",
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: "top center",
      }}
    >
      {/* Top Centered Banner */}
      <div className="w-full text-center bg-[#0F4C81] text-white py-1.5 text-xs font-black uppercase tracking-widest border border-black border-b-0">
        TAX INVOICE
      </div>

      {/* Corporate Grid Table Header */}
      <table
        className="w-full table-fixed border border-black text-[9px] font-bold"
        style={{ borderCollapse: "collapse" }}
      >
        <colgroup>
          <col style={{ width: "50%" }} />
          <col style={{ width: "25%" }} />
          <col style={{ width: "25%" }} />
        </colgroup>
        <tbody>
          <tr>
            {/* Left Column: Logo & Company Address */}
            <td className="w-1/2 border-r border-black p-2.5 align-top" rowSpan={3}>
              <div className="flex gap-2.5 items-start mb-1.5">
                <div className="w-14 h-14 relative flex items-center justify-center flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo}
                    alt={compName}
                    className="max-h-14 max-w-14 object-contain drop-shadow-xs"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-[13px] uppercase tracking-tight text-[#0F4C81] leading-tight break-words">
                    {compName}
                  </div>
                  <div className="text-[7.5px] text-slate-700 uppercase tracking-widest font-black mt-0.5">
                    {tagline}
                  </div>
                </div>
              </div>
              <div className="space-y-0.5 leading-snug text-gray-800 font-bold text-[8.5px] break-words">
                <p className="break-words">{address}</p>
                <p>
                  <span className="text-gray-500 font-semibold">Phone:</span> {phone}
                </p>
                <p>
                  <span className="text-gray-500 font-semibold">E-Mail:</span>{" "}
                  <span className="text-[#0F4C81] font-bold break-all">{email}</span>
                </p>
                <p className="font-black text-black pt-1 text-[9px]">
                  GSTIN: {gst}
                </p>
              </div>
            </td>

            {/* Right sub-grids */}
            <td className="w-1/4 border-r border-b border-black p-1.5 align-top">
              <div className="text-gray-500 font-bold uppercase text-[7px] tracking-wider mb-0.5">
                Invoice No.
              </div>
              <div className="font-mono font-black text-[11px] text-[#0F4C81] whitespace-nowrap">
                {data.invoiceNumber || "INV-2026-001"}
              </div>
            </td>
            <td className="w-1/4 border-b border-black p-1.5 align-top">
              <div className="text-gray-500 font-bold uppercase text-[7px] tracking-wider mb-0.5">
                Dated
              </div>
              <div className="font-black text-[9.5px] text-gray-900 whitespace-nowrap">
                {data.invoiceDate || "—"}
              </div>
            </td>
          </tr>

          <tr>
            <td className="border-r border-b border-black p-1.5 align-top">
              <div className="text-gray-500 font-bold uppercase text-[7px] tracking-wider mb-0.5">
                Due Date
              </div>
              <div className="font-bold text-[9px] text-gray-800 whitespace-nowrap">
                {data.dueDate || "—"}
              </div>
            </td>
            <td className="border-b border-black p-1.5 align-top">
              <div className="text-gray-500 font-bold uppercase text-[7px] tracking-wider mb-0.5">
                Mode / Terms of Payment
              </div>
              <div className="font-bold text-[9px] text-gray-800 break-words">
                {data.paymentMethod || "Bank Transfer"}
              </div>
            </td>
          </tr>

          <tr>
            <td className="border-r border-black p-1.5 align-top">
              <div className="text-gray-500 font-bold uppercase text-[7px] tracking-wider mb-0.5">
                Reference No.
              </div>
              <div className="font-mono text-[9px] text-gray-800 break-words">
                {data.refNo || "—"}
              </div>
            </td>
            <td className="p-1.5 align-top">
              <div className="text-gray-500 font-bold uppercase text-[7px] tracking-wider mb-0.5">
                Payment Status
              </div>
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                  data.paymentStatus === "PAID"
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : data.paymentStatus === "PARTIALLY PAID"
                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                    : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}
              >
                {data.paymentStatus || "UNPAID"}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Buyer (Bill to) Header & Box */}
      <div className="w-full bg-gray-100 text-[#1A1A1A] px-2.5 py-1 text-[8px] font-black uppercase tracking-wider border border-black border-t-0">
        Buyer (Bill to) - {data.customerName || "CUSTOMER NAME"}
      </div>
      <div className="w-full border border-black border-t-0 p-2.5 text-[9px] space-y-1 font-bold">
        <div className="text-xs font-black text-gray-900 leading-tight uppercase break-words">
          {data.customerName || "—"}
        </div>
        <div className="text-gray-700 font-medium text-[8.5px] leading-snug whitespace-pre-wrap break-words min-h-[14px]">
          {data.customerAddress || "Address: —"}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1 text-[8.5px] leading-snug border-t border-gray-200">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 uppercase font-black text-[7.5px]">GSTIN:</span>
            <span className="font-mono font-bold text-gray-800">
              {data.customerGst || "Unregistered"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 uppercase font-black text-[7.5px]">Mobile:</span>
            <span className="font-bold text-gray-800">
              {data.customerMobile || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Service / Goods Ledger Grid */}
      <table
        className="w-full table-fixed border border-black border-t-0 text-[9px] font-bold"
        style={{ borderCollapse: "collapse" }}
      >
        <colgroup>
          <col style={{ width: "6%" }} />
          <col style={{ width: "40%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "7%" }} />
          <col style={{ width: "14%" }} />
        </colgroup>
        <thead>
          <tr className="bg-gray-100 border-b border-black text-[7.5px] font-black uppercase tracking-wider text-center">
            <th className="py-1.5 border-r border-black">Sr. NO</th>
            <th className="py-1.5 border-r border-black text-left px-2">DESCRIPTION OF GOODS / SERVICES</th>
            <th className="py-1.5 border-r border-black">HSN</th>
            <th className="py-1.5 border-r border-black">Quantity</th>
            <th className="py-1.5 border-r border-black text-right px-2">Rate</th>
            <th className="py-1.5 border-r border-black">per</th>
            <th className="py-1.5 text-right px-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items && data.items.length > 0 ? (
            data.items.map((item, idx) => {
              const qty = Number(item.quantity) || 0;
              const rate = Number(item.rate) || 0;
              // Horizontal consistency: Taxable value = Quantity * Rate
              const lineTaxable = (qty > 0 && rate > 0) ? Math.round(qty * rate) : (Number(item.amount) || 0);

              return (
                <tr key={idx} className="border-b border-gray-100 align-top">
                  <td className="py-1.5 text-center border-r border-black text-gray-500 font-normal">
                    {idx + 1}
                  </td>
                  <td className="py-1.5 px-2 border-r border-black text-gray-900 leading-snug text-left break-words">
                    <div className="font-bold text-[9px]">{item.description}</div>
                  </td>
                  <td className="py-1.5 text-center border-r border-black text-gray-700 font-mono text-[8.5px]">
                    {item.hsn || "—"}
                  </td>
                  <td className="py-1.5 text-center border-r border-black text-gray-700 font-bold">
                    {qty}
                  </td>
                  <td className="py-1.5 px-2 text-right border-r border-black text-gray-700 font-mono">
                    {formatIndianCurrency(rate)}
                  </td>
                  <td className="py-1.5 text-center border-r border-black text-gray-600 font-medium italic">
                    {item.per || "Set"}
                  </td>
                  <td className="py-1.5 px-2 text-right text-gray-900 font-mono font-bold">
                    {formatIndianCurrency(lineTaxable)}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} className="py-4 text-center text-gray-400">
                No items added.
              </td>
            </tr>
          )}

          {/* Subtotal, CGST, SGST, Discount, and Total Rows */}
          <tr className="border-t border-black bg-gray-50/50">
            <td className="py-1 border-r border-black" colSpan={4}></td>
            <td className="py-1 px-2 border-r border-black text-right font-black uppercase text-[7.5px]" colSpan={2}>
              SUB TOTAL
            </td>
            <td className="py-1 px-2 text-right font-black font-mono">
              {formatIndianCurrency(subtotal)}
            </td>
          </tr>
          <tr className="border-b border-gray-200">
            <td className="py-1 border-r border-black" colSpan={4}></td>
            <td className="py-1 px-2 border-r border-black text-right font-black uppercase text-[7.5px]" colSpan={2}>
              CGST @ {halfGstPercent}%
            </td>
            <td className="py-1 px-2 text-right font-black font-mono">
              {formatIndianCurrency(cgstAmount)}
            </td>
          </tr>
          <tr className="border-b border-black">
            <td className="py-1 border-r border-black" colSpan={4}></td>
            <td className="py-1 px-2 border-r border-black text-right font-black uppercase text-[7.5px]" colSpan={2}>
              SGST @ {halfGstPercent}%
            </td>
            <td className="py-1 px-2 text-right font-black font-mono">
              {formatIndianCurrency(sgstAmount)}
            </td>
          </tr>
          {discount > 0 && (
            <tr className="border-b border-black text-emerald-700">
              <td className="py-1 border-r border-black" colSpan={4}></td>
              <td className="py-1 px-2 border-r border-black text-right font-black uppercase text-[7.5px]" colSpan={2}>
                DISCOUNT
              </td>
              <td className="py-1 px-2 text-right font-black font-mono">
                -{formatIndianCurrency(discount)}
              </td>
            </tr>
          )}
          <tr className="bg-gray-100 font-black border-b border-black">
            <td className="py-1.5 px-2 uppercase text-[7.5px] tracking-wider border-r border-black" colSpan={4}>
              TOTAL INVOICE VALUE
            </td>
            <td className="py-1.5 px-2 border-r border-black text-right font-black uppercase text-[7.5px]" colSpan={2}>
              TOTAL (₹)
            </td>
            <td className="py-1.5 px-2 text-right text-[#0F4C81] font-black text-xs font-mono">
              {formatIndianCurrency(totalAmount)}
            </td>
          </tr>
          {amountPaid > 0 && (
            <>
              <tr className="border-b border-gray-200 text-slate-700">
                <td className="py-1 border-r border-black" colSpan={4}></td>
                <td className="py-1 px-2 border-r border-black text-right font-bold uppercase text-[7.5px]" colSpan={2}>
                  AMOUNT PAID
                </td>
                <td className="py-1 px-2 text-right font-bold font-mono text-emerald-700">
                  {formatIndianCurrency(amountPaid)}
                </td>
              </tr>
              <tr className="border-b border-black bg-amber-50/60 font-black">
                <td className="py-1 border-r border-black" colSpan={4}></td>
                <td className="py-1 px-2 border-r border-black text-right font-black uppercase text-[7.5px] text-amber-900" colSpan={2}>
                  BALANCE DUE
                </td>
                <td className="py-1 px-2 text-right font-black font-mono text-amber-900">
                  {formatIndianCurrency(balanceDue)}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      {/* Bottom GST Audit Breakdown Table */}
      <div className="w-full text-center bg-gray-50 text-gray-800 py-0.5 text-[7.5px] font-bold uppercase tracking-wider border border-black border-t-0">
        GST Tax Breakdown Grid
      </div>
      <table
        className="w-full table-fixed border border-black border-t-0 text-[8px] font-bold"
        style={{ borderCollapse: "collapse" }}
      >
        <colgroup>
          <col style={{ width: "22%" }} />
          <col style={{ width: "18%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "13%" }} />
          <col style={{ width: "18%" }} />
        </colgroup>
        <thead>
          <tr className="bg-gray-50 border-b border-black text-[7px] font-black uppercase text-center">
            <th className="py-1 border-r border-black" rowSpan={2}>GSTIN</th>
            <th className="py-1 border-r border-black" rowSpan={2}>Taxable Value</th>
            <th className="py-1 border-r border-black" colSpan={2}>CGST</th>
            <th className="py-1 border-r border-black" colSpan={2}>SGST</th>
            <th className="py-1 font-black" rowSpan={2}>Total Tax Amount</th>
          </tr>
          <tr className="bg-gray-50 border-b border-black text-[6.5px] font-black uppercase text-center">
            <th className="py-0.5 border-r border-black">Rate</th>
            <th className="py-0.5 border-r border-black">Amount</th>
            <th className="py-0.5 border-r border-black">Rate</th>
            <th className="py-0.5 border-r border-black">Amount</th>
          </tr>
        </thead>
        <tbody className="text-center font-bold">
          <tr className="align-middle">
            <td className="py-1 border-r border-black text-[7.5px] font-mono">{gst}</td>
            <td className="py-1 px-2 border-r border-black font-mono text-right">
              {formatIndianCurrency(subtotal)}
            </td>
            <td className="py-1 border-r border-black">{halfGstPercent}%</td>
            <td className="py-1 px-2 border-r border-black font-mono text-right">
              {formatIndianCurrency(cgstAmount)}
            </td>
            <td className="py-1 border-r border-black">{halfGstPercent}%</td>
            <td className="py-1 px-2 border-r border-black font-mono text-right">
              {formatIndianCurrency(sgstAmount)}
            </td>
            <td className="py-1 px-2 font-mono text-right">
              {formatIndianCurrency(totalGst)}
            </td>
          </tr>
          <tr className="bg-gray-50 border-t border-black font-black uppercase text-[7px]">
            <td className="py-1 border-r border-black text-left px-2">TOTAL</td>
            <td className="py-1 px-2 border-r border-black font-mono text-right">
              {formatIndianCurrency(subtotal)}
            </td>
            <td className="py-1 border-r border-black">—</td>
            <td className="py-1 px-2 border-r border-black font-mono text-right">
              {formatIndianCurrency(cgstAmount)}
            </td>
            <td className="py-1 border-r border-black">—</td>
            <td className="py-1 px-2 border-r border-black font-mono text-right">
              {formatIndianCurrency(sgstAmount)}
            </td>
            <td className="py-1 px-2 font-mono text-right">
              {formatIndianCurrency(totalGst)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Total Amount in Words Banner, Accounts Details & Legal Declaration, Authorized Signatory */}
      <div className="keep-together page-break-avoid">
        <div className="w-full bg-[#0F4C81] text-white px-3 py-1.5 text-[8px] font-black uppercase tracking-wider border border-black border-t-0 flex flex-wrap items-baseline gap-2 leading-relaxed">
          <span className="text-blue-200 uppercase font-bold text-[7.5px]">Total Amount (in words):</span>
          <span className="font-extrabold text-[8.5px] text-white">{convertNumberToWords(totalAmount)}</span>
        </div>

          {/* Accounts Details & Legal Declaration */}
          <table
            className="w-full table-fixed border border-black border-t-0 text-[8.5px]"
            style={{ borderCollapse: "collapse" }}
          >
            <tbody>
              <tr>
                <td className="w-1/2 border-r border-black p-2 align-top leading-tight font-bold">
                  <div className="text-[8px] font-black uppercase tracking-wider mb-1 border-b border-gray-300 pb-0.5 text-gray-900">
                    ACCOUNT DETAILS
                  </div>
                  <div className="space-y-0.5 text-gray-800">
                    <p className="flex justify-between">
                      <span className="text-gray-500 font-bold">a. Company Name:</span>
                      <span className="font-black text-gray-900">{company.accountName || compName}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500 font-bold">b. Account Number:</span>
                      <span className="font-mono font-black text-gray-900">
                        {company.accountNumber || "0058107040000460"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500 font-bold">c. IFSC Code:</span>
                      <span className="font-mono font-black text-gray-900">
                        {company.ifscCode || "MSCI0082056"}
                      </span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-gray-500 font-bold">d. Bank & Branch:</span>
                      <span className="font-bold text-gray-900">
                        {company.bankName || "Maharashtra State Co-operative Bank"}
                        {company.branch ? `, ${company.branch}` : ""}
                      </span>
                    </p>
                    {company.upiId ? (
                      <>
                        <p className="flex justify-between">
                          <span className="text-gray-500 font-bold">e. UPI / VPA:</span>
                          <span className="font-mono font-black text-[#0F4C81]">{company.upiId}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-gray-500 font-bold">f. GSTIN:</span>
                          <span className="font-mono font-black">{gst}</span>
                        </p>
                      </>
                    ) : (
                      <p className="flex justify-between">
                        <span className="text-gray-500 font-bold">e. GSTIN:</span>
                        <span className="font-mono font-black">{gst}</span>
                      </p>
                    )}
                  </div>
                </td>
                <td className="w-1/2 p-2 align-top leading-tight font-bold flex flex-col justify-between h-full">
                  <div>
                    <p className="text-[7.5px] text-gray-600 leading-normal italic font-medium pt-1">
                      We declare that this invoice shows the actual price of the goods / services described and that all particulars are true and correct.
                    </p>
                  </div>
                  {data.notes && (
                    <div className="text-[7.5px] text-slate-700 mt-1 pt-1 border-t border-gray-200">
                      <span className="font-bold text-gray-800">Remarks: </span>
                      {data.notes}
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Authorized Signatory Block */}
          <div className="w-full border border-black border-t-0 p-2.5 flex justify-between items-center text-[9px] font-bold">
            <div className="text-left font-bold space-y-0.5">
              <p className="text-gray-500 font-black uppercase tracking-wider text-[6.5px]">
                Authorized Signatory
              </p>
              <p className="font-black text-[10px] uppercase text-[#0F4C81]">
                {compName}
              </p>
              <p className="font-black text-gray-700 pt-4 border-t border-dashed border-gray-400 w-36 mt-3 text-[8px]">
                Authorized Signature
              </p>
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="h-8 w-36 border-b border-dashed border-gray-300" />
            </div>
          </div>
        </div>
    </div>
  );
}
