"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import InvoicePreview, { InvoiceData, InvoiceItemData } from "./InvoicePreview";
import { CompanySnapshot } from "@/lib/company";
import { PAYMENT_STATUS_OPTIONS, PAYMENT_METHOD_OPTIONS } from "@/lib/presets";
import { formatDateDMY, formatIndianCurrency, parseCurrencyInput } from "@/lib/formatters";
import {
  Save,
  Printer,
  FileDown,
  Plus,
  Trash2,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Calculator,
  FileText,
  Eye,
} from "lucide-react";

interface InvoiceEditorProps {
  initialData?: InvoiceData & { id?: string; quotationId?: string | null };
  company: CompanySnapshot;
  previewInvoiceNumber: string;
}

export default function InvoiceEditor({
  initialData,
  company,
  previewInvoiceNumber,
}: InvoiceEditorProps) {
  const router = useRouter();

  // Today and 10 days later for due date
  const today = formatDateDMY(new Date());
  const defaultDue = formatDateDMY(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000));

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState<string>(
    initialData?.invoiceNumber || previewInvoiceNumber
  );
  const [invoiceDate, setInvoiceDate] = useState<string>(
    initialData?.invoiceDate || today
  );
  const [dueDate, setDueDate] = useState<string>(
    initialData?.dueDate || defaultDue
  );
  const [customerName, setCustomerName] = useState<string>(
    initialData?.customerName || ""
  );
  const [customerAddress, setCustomerAddress] = useState<string>(
    initialData?.customerAddress || ""
  );
  const [customerMobile, setCustomerMobile] = useState<string>(
    initialData?.customerMobile || ""
  );
  const [customerGst, setCustomerGst] = useState<string>(
    initialData?.customerGst || ""
  );

  const [items, setItems] = useState<InvoiceItemData[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : [
          {
            description: "Solar PV System Installation (3.0 kW Rooftop Solar)",
            quantity: 1,
            rate: 177966,
            gstRate: 18,
            amount: 210000,
          },
        ]
  );

  const [discount, setDiscount] = useState<number>(initialData?.discount || 0);
  const [amountPaid, setAmountPaid] = useState<number>(
    initialData?.amountPaid || 0
  );
  const [paymentStatus, setPaymentStatus] = useState<string>(
    initialData?.paymentStatus || "UNPAID"
  );
  const [paymentMethod, setPaymentMethod] = useState<string>(
    initialData?.paymentMethod || "Bank Transfer"
  );
  const [notes, setNotes] = useState<string>(initialData?.notes || "");

  // Calculated totals
  const [subtotal, setSubtotal] = useState<number>(initialData?.subtotal || 0);
  const [gstAmount, setGstAmount] = useState<number>(initialData?.gstAmount || 0);
  const [totalAmount, setTotalAmount] = useState<number>(
    initialData?.totalAmount || 0
  );

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);
  const [savedDocId, setSavedDocId] = useState<string | null>(
    initialData?.id || null
  );
  const [previewScale, setPreviewScale] = useState<number>(0.72);
  const [activeMobileTab, setActiveMobileTab] = useState<"form" | "preview">("form");

  // Adjust default scale on small mobile screens to fit neatly
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setPreviewScale(0.42);
    }
  }, []);

  // Recalculate totals whenever items or discount change
  useEffect(() => {
    let calculatedSubtotal = 0;
    let calculatedGst = 0;

    items.forEach((item) => {
      const base = item.quantity * item.rate;
      const gst = base * (item.gstRate / 100);
      calculatedSubtotal += base;
      calculatedGst += gst;
    });

    const calculatedTotal = Math.round(calculatedSubtotal + calculatedGst - discount);
    setSubtotal(Math.round(calculatedSubtotal));
    setGstAmount(Math.round(calculatedGst));
    setTotalAmount(calculatedTotal);
  }, [items, discount]);

  // Update line item
  const handleItemChange = (
    index: number,
    field: keyof InvoiceItemData,
    val: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };

      // Recalculate item line total amount
      const q = field === "quantity" ? Number(val) || 0 : item.quantity;
      const r = field === "rate" ? Number(val) || 0 : item.rate;
      const g = field === "gstRate" ? Number(val) || 0 : item.gstRate;
      const base = q * r;
      item.amount = Math.round(base * (1 + g / 100));

      updated[index] = item;
      return updated;
    });
  };

  // Helper: auto-calculate base rate from gross amount
  const handleSetGrossAmount = (index: number, gross: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const gstFactor = 1 + item.gstRate / 100;
      const baseRate = Math.round(gross / gstFactor / (item.quantity || 1));
      item.rate = baseRate;
      item.amount = gross;
      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        description: "",
        quantity: 1,
        rate: 0,
        gstRate: 18,
        amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!invoiceDate.trim()) errs.invoiceDate = "Invoice date is required";
    if (!customerName.trim()) errs.customerName = "Customer name is required";
    if (items.length === 0) errs.items = "Add at least one item";
    if (totalAmount <= 0) errs.totalAmount = "Grand total must be greater than 0";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (generatePdfAfter: boolean = false) => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);
    setSavedSuccess(null);

    const payload = {
      id: initialData?.id,
      quotationId: initialData?.quotationId,
      invoiceDate,
      dueDate,
      customerName: customerName.trim(),
      customerAddress: customerAddress.trim(),
      customerMobile: customerMobile.trim(),
      customerGst: customerGst.trim(),
      items,
      subtotal,
      gstAmount,
      discount,
      totalAmount,
      amountPaid,
      paymentStatus,
      paymentMethod,
      notes: notes.trim(),
    };

    try {
      const isEdit = Boolean(initialData?.id);
      const url = isEdit
        ? `/api/invoices/${initialData?.id}`
        : `/api/invoices`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save invoice");
      }

      const docId = json.invoice.id;
      setSavedDocId(docId);
      setInvoiceNumber(json.invoice.invoiceNumber);
      setSavedSuccess(
        `Invoice ${json.invoice.invoiceNumber} saved successfully!`
      );

      if (generatePdfAfter) {
        window.open(`/api/invoices/${docId}/pdf`, "_blank");
      }

      if (!isEdit) {
        setTimeout(() => {
          router.push(`/invoices/${docId}`);
        }, 1200);
      }
    } catch (err: any) {
      alert(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  const previewData: InvoiceData = {
    invoiceNumber,
    invoiceDate,
    dueDate,
    customerName,
    customerAddress,
    customerMobile,
    customerGst,
    items,
    subtotal,
    gstAmount,
    discount,
    totalAmount,
    amountPaid,
    paymentStatus,
    paymentMethod,
    notes,
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
      {/* Notifications */}
      {savedSuccess && (
        <div className="no-print mb-4 p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-md flex items-center justify-between text-sm shadow-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold">{savedSuccess}</span>
          </div>
          {savedDocId && (
            <div className="flex space-x-2">
              <a
                href={`/api/invoices/${savedDocId}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded flex items-center space-x-1"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Mobile View Switcher (Visible only on < lg) */}
      <div className="no-print lg:hidden mb-4 flex rounded-lg bg-slate-200/80 p-1">
        <button
          type="button"
          onClick={() => setActiveMobileTab("form")}
          className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center space-x-1.5 transition ${
            activeMobileTab === "form"
              ? "bg-[#0F4C81] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Edit Invoice Form</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMobileTab("preview")}
          className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center space-x-1.5 transition ${
            activeMobileTab === "preview"
              ? "bg-[#0F4C81] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Live A4 Preview</span>
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT PANEL: Form */}
        <div
          className={`no-print lg:col-span-5 bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-5 space-y-6 ${
            activeMobileTab === "form" ? "block" : "hidden lg:block"
          }`}
        >
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0F4C81]">
                {initialData?.id ? "Edit Tax Invoice" : "New Tax Invoice"}
              </h2>
              <p className="text-xs text-slate-500">
                Number: <span className="font-bold text-slate-700">{invoiceNumber}</span>
              </p>
            </div>
            {initialData?.quotationId && (
              <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2 py-1 rounded border border-blue-200">
                From Quotation
              </span>
            )}
          </div>

          {/* Section A: Dates */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              Invoice Dates
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Invoice Date *
                </label>
                <input
                  type="text"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Due Date
                </label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section B: Customer Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              Customer Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rajesh Patil / ABC Industries"
                className={`w-full text-xs px-3 py-2 border rounded focus:ring-1 focus:ring-[#0F4C81] outline-none ${
                  errors.customerName ? "border-red-500" : "border-slate-300"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Billing Address
              </label>
              <textarea
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                rows={2}
                placeholder="Complete billing address"
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={customerGst}
                  onChange={(e) => setCustomerGst(e.target.value)}
                  placeholder="27XXXXX0000X1ZX"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section C: Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Line Items ({items.length})
              </h3>
            </div>

            {errors.items && (
              <p className="text-[11px] text-red-500">{errors.items}</p>
            )}

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 rounded p-3 bg-slate-50 relative group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      ITEM {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-rose-500 hover:text-rose-700 p-1 rounded transition text-xs flex items-center space-x-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(idx, "description", e.target.value)
                        }
                        placeholder="Item Description (e.g. Solar PV System Installation)"
                        className="w-full text-xs font-medium px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                          Qty
                        </label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full text-xs px-2 py-1 border border-slate-300 rounded bg-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                          Rate (Base)
                        </label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full text-xs px-2 py-1 border border-slate-300 rounded bg-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                          GST %
                        </label>
                        <input
                          type="number"
                          value={item.gstRate}
                          onChange={(e) =>
                            handleItemChange(
                              idx,
                              "gstRate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full text-xs px-2 py-1 border border-slate-300 rounded bg-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">
                          Amount (Gross)
                        </label>
                        <input
                          type="text"
                          readOnly
                          value={formatIndianCurrency(item.amount)}
                          className="w-full text-xs px-2 py-1 border border-slate-200 rounded bg-slate-100 text-slate-800 font-bold outline-none cursor-default"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2 border border-dashed border-[#0F4C81] text-[#0F4C81] hover:bg-blue-50/50 font-semibold rounded text-xs flex items-center justify-center space-x-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Item</span>
            </button>
          </div>

          {/* Section D: Payment & Totals */}
          <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Payment Status & Calculation
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none"
                >
                  {PAYMENT_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white outline-none"
                >
                  {PAYMENT_METHOD_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Payment / Bank Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bank account, UPI ID, or payment terms"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(false)}
              className="flex-1 min-w-[130px] bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-4 rounded text-xs flex items-center justify-center space-x-1.5 transition shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Draft"}</span>
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleSave(true)}
              className="flex-1 min-w-[160px] bg-[#F37021] hover:bg-[#D95D14] text-white font-bold py-2.5 px-4 rounded text-xs flex items-center justify-center space-x-1.5 transition shadow-sm disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>Save & Generate PDF</span>
            </button>

            <button
              type="button"
              onClick={handleBrowserPrint}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs flex items-center space-x-1 transition border border-slate-300"
              title="Direct Print or Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: Live A4 Invoice Preview */}
        <div
          className={`lg:col-span-7 flex-col items-center w-full max-w-full overflow-hidden ${
            activeMobileTab === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="no-print w-full flex items-center justify-between mb-3 bg-white p-2 px-3 sm:px-4 rounded-lg border border-slate-200 shadow-sm text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#0F4C81]">Live A4 Invoice Preview</span>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">Updates in real time</span>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                type="button"
                onClick={() => setPreviewScale((s) => Math.max(0.3, parseFloat((s - 0.05).toFixed(2))))}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] text-slate-700 w-9 text-center">
                {Math.round(previewScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPreviewScale((s) => Math.min(1.0, parseFloat((s + 0.05).toFixed(2))))}
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPreviewScale(
                    typeof window !== "undefined" && window.innerWidth < 640
                      ? 0.42
                      : 0.72
                  )
                }
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600 ml-1"
                title="Reset Fit"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Document Container with layout-bounded scaling */}
          <div className="w-full max-w-full overflow-x-auto py-2 flex justify-center bg-slate-200/50 rounded-lg p-2 sm:p-4 border border-slate-200">
            <div
              style={{
                width: `${210 * previewScale}mm`,
                height: `${297 * previewScale}mm`,
                flexShrink: 0,
                transition: "width 0.15s ease-out, height 0.15s ease-out",
              }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                  width: "210mm",
                  height: "297mm",
                }}
              >
                <InvoicePreview
                  data={previewData}
                  company={company}
                  scale={1}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
