/**
 * Shashikala Power Tech — Authoritative GST Calculation & Slab Reconciliation Engine
 * TypeScript definition & re-export wrapper.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const engine = require("./gst-engine");

export interface GstLineItemInput {
  id?: string;
  description?: string;
  hsn?: string;
  quantity: number | string;
  rate: number | string;
  gstRate: number | string;
  amount?: number | string;
  per?: string;
  [key: string]: any;
}

export interface CalculatedGstItem {
  id?: string;
  description: string;
  hsn?: string;
  quantity: number;
  rate: number;
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  per?: string;
}

export interface GstSlabSummary {
  gstRate: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
}

export interface InvoiceGstCalculation {
  isInterState: boolean;
  items: CalculatedGstItem[];
  slabs: GstSlabSummary[];
  subtotal: number;
  totalGst: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalBeforeDiscount: number;
  discount: number;
  totalAmount: number;
  roundedTotalAmount: number;
  roundOff: number;
  effectiveGstRate: number;
}

export interface GstCalculationOptions {
  isInterState?: boolean;
  customerGst?: string | null;
  companyGst?: string | null;
  discount?: number | string | null;
  roundToWholeRupee?: boolean;
}

export const round2: (num: number) => number = engine.round2;
export const isInterStateSupply: (
  companyGst?: string | null,
  customerGst?: string | null,
  explicitInterState?: boolean
) => boolean = engine.isInterStateSupply;
export const calculateLineItemGst: (
  item: GstLineItemInput,
  isInterState?: boolean
) => CalculatedGstItem = engine.calculateLineItemGst;
export const calculateInvoiceGst: (
  items: GstLineItemInput[],
  options?: GstCalculationOptions
) => InvoiceGstCalculation = engine.calculateInvoiceGst;
export const calculateBaseRateFromGross: (
  grossAmount: number | string,
  gstRate?: number | string,
  quantity?: number | string
) => number = engine.calculateBaseRateFromGross;
export const formatGstRate: (rate: number) => string = engine.formatGstRate;
