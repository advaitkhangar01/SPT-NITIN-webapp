"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QuotationPreview, { QuotationData, QuotationItemData } from "./QuotationPreview";
import { CompanySnapshot } from "@/lib/company";
import { PREDEFINED_COMPONENTS, PROPOSED_SYSTEM_OPTIONS, CONNECTION_TYPE_OPTIONS } from "@/lib/presets";
import { formatDateDMY, formatIndianCurrency, parseCurrencyInput } from "@/lib/formatters";
import {
  Save,
  Printer,
  FileDown,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Eye,
} from "lucide-react";

interface QuotationEditorProps {
  initialData?: QuotationData & { id?: string };
  company: CompanySnapshot;
  previewQuotationNumber: string;
}

export default function QuotationEditor({
  initialData,
  company,
  previewQuotationNumber,
}: QuotationEditorProps) {
  const router = useRouter();

  // Form State
  const [quotationNumber, setQuotationNumber] = useState<string>(
    initialData?.quotationNumber || previewQuotationNumber
  );
  const [date, setDate] = useState<string>(
    initialData?.date || formatDateDMY(new Date())
  );
  const [customerName, setCustomerName] = useState<string>(
    initialData?.customerName || ""
  );
  const [proposedSystem, setProposedSystem] = useState<string>(
    initialData?.proposedSystem || "On-Grid Rooftop Solar"
  );
  const [customProposedSystem, setCustomProposedSystem] = useState<string>("");
  const [connectionType, setConnectionType] = useState<string>(
    initialData?.connectionType || "LT 1-Phase Grid Connected"
  );
  const [customConnectionType, setCustomConnectionType] = useState<string>("");
  const [systemCapacity, setSystemCapacity] = useState<string>(
    initialData?.systemCapacity || "3.00"
  );
  const [estimatedGeneration, setEstimatedGeneration] = useState<string>(
    initialData?.estimatedGeneration || "12 - 16"
  );
  const [validityDays, setValidityDays] = useState<number>(
    initialData?.validityDays || 15
  );

  const [items, setItems] = useState<QuotationItemData[]>(
    initialData?.items && initialData.items.length > 0
      ? initialData.items
      : PREDEFINED_COMPONENTS.slice(0, 6).map((preset) => ({
          component: preset.component,
          specification: preset.specification,
          brandModel: preset.brandModel,
          quantity: preset.quantity,
        }))
  );

  const [totalAmount, setTotalAmount] = useState<number>(
    initialData?.totalAmount || 210000
  );
  const [rawAmountInput, setRawAmountInput] = useState<string>(
    initialData?.totalAmount ? String(initialData.totalAmount) : "210000"
  );
  const [gstInclusive, setGstInclusive] = useState<boolean>(
    initialData?.gstInclusive ?? true
  );
  const [investmentNote, setInvestmentNote] = useState<string>(
    initialData?.investmentNote ||
      "Includes all materials, transport, installation & net-metering support."
  );
  const [showDocumentsRequired, setShowDocumentsRequired] = useState<boolean>(
    initialData?.showDocumentsRequired ?? true
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

  // Quick component adder
  const handleAddPreset = (presetIndex: number) => {
    const preset = PREDEFINED_COMPONENTS[presetIndex];
    if (!preset) return;
    setItems((prev) => [
      ...prev,
      {
        component: preset.component,
        specification: preset.specification,
        brandModel: preset.brandModel,
        quantity: preset.quantity,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof QuotationItemData,
    value: string
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRawAmountInput(val);
    const parsed = parseCurrencyInput(val);
    setTotalAmount(parsed);
  };

  // Validation
  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.customerName = "Customer name is required";
    if (!date.trim()) errs.date = "Date is required";
    if (proposedSystem === "Custom" && !customProposedSystem.trim()) {
      errs.proposedSystem = "Please specify custom system";
    }
    if (connectionType === "Custom" && !customConnectionType.trim()) {
      errs.connectionType = "Please specify custom connection";
    }
    if (!systemCapacity.trim()) errs.systemCapacity = "System capacity is required";
    if (!estimatedGeneration.trim()) errs.estimatedGeneration = "Estimated generation is required";
    if (items.length === 0) errs.items = "Add at least one component";
    if (totalAmount <= 0) errs.totalAmount = "Total amount must be greater than 0";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save handler
  const handleSave = async (generatePdfAfter: boolean = false) => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);
    setSavedSuccess(null);

    const payload = {
      id: initialData?.id,
      date,
      customerName: customerName.trim(),
      proposedSystem:
        proposedSystem === "Custom" ? customProposedSystem.trim() : proposedSystem,
      connectionType:
        connectionType === "Custom" ? customConnectionType.trim() : connectionType,
      systemCapacity: systemCapacity.trim(),
      estimatedGeneration: estimatedGeneration.trim(),
      validityDays: Number(validityDays) || 15,
      items,
      totalAmount,
      gstInclusive,
      investmentNote: investmentNote.trim(),
    };

    try {
      const isEdit = Boolean(initialData?.id);
      const url = isEdit
        ? `/api/quotations/${initialData?.id}`
        : `/api/quotations`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save quotation");
      }

      const docId = json.quotation.id;
      setSavedDocId(docId);
      setQuotationNumber(json.quotation.quotationNumber);
      setSavedSuccess(
        `Quotation ${json.quotation.quotationNumber} saved successfully!`
      );

      if (generatePdfAfter) {
        // Open PDF download or trigger browser print
        window.open(`/api/quotations/${docId}/pdf`, "_blank");
      }

      // If it was a new creation, redirect to the document's edit/view page
      if (!isEdit) {
        setTimeout(() => {
          router.push(`/quotations/${docId}`);
        }, 1200);
      }
    } catch (err: any) {
      alert(err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Direct Browser Native Print
  const handleBrowserPrint = () => {
    window.print();
  };

  const previewData: QuotationData = {
    quotationNumber,
    date,
    customerName,
    proposedSystem:
      proposedSystem === "Custom" ? customProposedSystem : proposedSystem,
    connectionType:
      connectionType === "Custom" ? customConnectionType : connectionType,
    systemCapacity,
    estimatedGeneration,
    validityDays: Number(validityDays) || 15,
    items,
    totalAmount,
    gstInclusive,
    investmentNote,
    showDocumentsRequired,
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
                href={`/api/quotations/${savedDocId}/pdf`}
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
          <span>Edit Quotation Form</span>
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

      {/* Main Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT PANEL: Form / Input (~42% on desktop) */}
        <div
          className={`no-print lg:col-span-5 bg-white border border-slate-200 rounded-lg shadow-sm p-4 sm:p-5 space-y-6 ${
            activeMobileTab === "form" ? "block" : "hidden lg:block"
          }`}
        >
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-[#0F4C81]">
                {initialData?.id ? "Edit Quotation" : "New Quotation"}
              </h2>
              <p className="text-xs text-slate-500">
                Number: <span className="font-bold text-slate-700">{quotationNumber}</span>
              </p>
            </div>
            <div className="text-xs text-right">
              <span className="text-slate-400 block">Status</span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Ready
              </span>
            </div>
          </div>

          {/* Section A: Date & Customer Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              Customer Details & Date
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quotation Date
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className={`w-full text-xs px-3 py-2 border rounded focus:ring-1 focus:ring-[#0F4C81] outline-none ${
                    errors.date ? "border-red-500" : "border-slate-300"
                  }`}
                />
                {errors.date && (
                  <p className="text-[11px] text-red-500 mt-0.5">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rajesh Patil"
                  className={`w-full text-xs px-3 py-2 border rounded focus:ring-1 focus:ring-[#0F4C81] outline-none ${
                    errors.customerName ? "border-red-500" : "border-slate-300"
                  }`}
                />
                {errors.customerName && (
                  <p className="text-[11px] text-red-500 mt-0.5">
                    {errors.customerName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Proposed System
                </label>
                <select
                  value={proposedSystem}
                  onChange={(e) => setProposedSystem(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none bg-white"
                >
                  {PROPOSED_SYSTEM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {proposedSystem === "Custom" && (
                  <input
                    type="text"
                    value={customProposedSystem}
                    onChange={(e) => setCustomProposedSystem(e.target.value)}
                    placeholder="Enter custom proposed system"
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded mt-1.5 outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Connection Type
                </label>
                <select
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none bg-white"
                >
                  {CONNECTION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {connectionType === "Custom" && (
                  <input
                    type="text"
                    value={customConnectionType}
                    onChange={(e) => setCustomConnectionType(e.target.value)}
                    placeholder="Enter custom connection type"
                    className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded mt-1.5 outline-none"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section B: Project Summary */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1">
              Project Summary
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Capacity (kW) *
                </label>
                <input
                  type="text"
                  value={systemCapacity}
                  onChange={(e) => setSystemCapacity(e.target.value)}
                  placeholder="3.00"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Units / Day *
                </label>
                <input
                  type="text"
                  value={estimatedGeneration}
                  onChange={(e) => setEstimatedGeneration(e.target.value)}
                  placeholder="12 - 16"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Validity (Days)
                </label>
                <input
                  type="number"
                  value={validityDays}
                  onChange={(e) => setValidityDays(Number(e.target.value))}
                  placeholder="15"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-[#0F4C81] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section C: Bill of Materials */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Bill of Materials ({items.length})
              </h3>

              {/* Quick Add Presets Dropdown */}
              <div className="relative group">
                <select
                  onChange={(e) => {
                    if (e.target.value !== "") {
                      handleAddPreset(Number(e.target.value));
                      e.target.value = "";
                    }
                  }}
                  defaultValue=""
                  className="text-xs bg-blue-50 text-[#0F4C81] font-semibold py-1 px-2.5 rounded border border-blue-200 outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    + Quick Add Preset
                  </option>
                  {PREDEFINED_COMPONENTS.map((p, idx) => (
                    <option key={idx} value={idx}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errors.items && (
              <p className="text-[11px] text-red-500">{errors.items}</p>
            )}

            {/* List of component blocks */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-slate-200 rounded p-3 bg-slate-50 relative group hover:border-slate-300 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                      DESCRIPTION {idx + 1}
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
                        value={item.component}
                        onChange={(e) =>
                          handleItemChange(idx, "component", e.target.value)
                        }
                        placeholder="Component Title (e.g. Solar PV Modules)"
                        className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={item.specification}
                        onChange={(e) =>
                          handleItemChange(idx, "specification", e.target.value)
                        }
                        placeholder="Specification (e.g. High-efficiency Mono PERC / Half-Cut Technology)"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none text-slate-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={item.brandModel}
                        onChange={(e) =>
                          handleItemChange(idx, "brandModel", e.target.value)
                        }
                        placeholder="Brand / Model (e.g. VIKRAM / WAAREE)"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none text-slate-600"
                      />
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", e.target.value)
                        }
                        placeholder="Quantity (e.g. 3.0 kW Capacity)"
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none text-slate-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setItems((prev) => [
                  ...prev,
                  {
                    component: "",
                    specification: "",
                    brandModel: "",
                    quantity: "",
                  },
                ])
              }
              className="w-full py-2 border border-dashed border-[#0F4C81] text-[#0F4C81] hover:bg-blue-50/50 font-semibold rounded text-xs flex items-center justify-center space-x-1 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Description</span>
            </button>
          </div>

          {/* Section D: Total Project Investment */}
          <div className="space-y-3 bg-[#E8F7EC]/40 p-3.5 rounded-lg border border-[#86EFAC]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#15803D]">
              Total Project Investment
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="text"
                  value={rawAmountInput}
                  onChange={handleAmountChange}
                  placeholder="2,10,000"
                  className={`w-full text-sm font-bold pl-7 pr-3 py-2 border rounded bg-white focus:ring-1 focus:ring-emerald-600 outline-none ${
                    errors.totalAmount ? "border-red-500" : "border-slate-300"
                  }`}
                />
              </div>
              <p className="text-[11px] text-emerald-800 font-medium mt-1">
                Formatted: {formatIndianCurrency(totalAmount)}
              </p>
              {errors.totalAmount && (
                <p className="text-[11px] text-red-500 mt-0.5">
                  {errors.totalAmount}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="gstInclusive"
                checked={gstInclusive}
                onChange={(e) => setGstInclusive(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <label htmlFor="gstInclusive" className="text-xs text-slate-700 font-medium cursor-pointer">
                Inclusive of GST & All Taxes
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Investment Note
              </label>
              <input
                type="text"
                value={investmentNote}
                onChange={(e) => setInvestmentNote(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white outline-none"
              />
            </div>

            {/* Documents Checklist Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-start space-x-2.5 bg-blue-50/60 p-2.5 rounded-md border border-blue-100">
              <input
                type="checkbox"
                id="showDocumentsRequired"
                checked={showDocumentsRequired}
                onChange={(e) => setShowDocumentsRequired(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0F4C81] focus:ring-[#0F4C81] cursor-pointer"
              />
              <label
                htmlFor="showDocumentsRequired"
                className="text-xs text-slate-700 font-medium cursor-pointer"
              >
                <span className="font-bold text-[#0F4C81] block">
                  Show Solar Application Documents Checklist
                </span>
                <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                  Includes the 6 required documents (Electricity bill, Aadhar, Photo, Cheque, A-1 Form) and load extension notice.
                </span>
              </label>
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

        {/* RIGHT PANEL: Live A4 Preview (~58% on desktop) */}
        <div
          className={`lg:col-span-7 flex-col items-center w-full max-w-full overflow-hidden ${
            activeMobileTab === "preview" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Controls Bar */}
          <div className="no-print w-full flex items-center justify-between mb-3 bg-white p-2 px-3 sm:px-4 rounded-lg border border-slate-200 shadow-sm text-xs text-slate-600">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[#0F4C81]">Live A4 Preview</span>
              <span className="text-slate-400 hidden sm:inline">|</span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Updates instantly as you type
              </span>
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
                <QuotationPreview
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
