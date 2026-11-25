import { calculateInvoiceGst, round2 } from "./gst";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ValidatedInvoiceItem {
  sortOrder: number;
  description: string;
  hsn?: string;
  quantity: number;
  rate: number;
  gstRate: number;
  amount: number;
}

export interface ValidatedInvoiceInput {
  invoiceNumber?: string;
  quotationId?: string | null;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  customerGst: string;
  subtotal: number;
  gstAmount: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
  paymentMethod: string;
  notes: string;
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  upiId?: string;
  items: ValidatedInvoiceItem[];
}

export function validateInvoicePayload(body: any): ValidationResult<ValidatedInvoiceInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request payload" };
  }

  let invoiceNumber: string | undefined = undefined;
  if (body.invoiceNumber !== undefined && body.invoiceNumber !== null) {
    if (typeof body.invoiceNumber !== "string") {
      return { success: false, error: "Invoice number must be a text value" };
    }
    invoiceNumber = body.invoiceNumber.trim();
    if (!invoiceNumber) {
      return { success: false, error: "Invoice number cannot be empty" };
    }
    if (invoiceNumber.length > 50) {
      return { success: false, error: "Invoice number cannot exceed 50 characters" };
    }
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  if (!customerName) {
    return { success: false, error: "Customer name is required" };
  }
  if (customerName.length > 200) {
    return { success: false, error: "Customer name cannot exceed 200 characters" };
  }

  const invoiceDate = typeof body.invoiceDate === "string" ? body.invoiceDate.trim() : "";
  if (!invoiceDate) {
    return { success: false, error: "Invoice date is required" };
  }

  const dueDate = typeof body.dueDate === "string" && body.dueDate.trim() ? body.dueDate.trim() : invoiceDate;

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { success: false, error: "At least one item is required in the invoice" };
  }

  if (body.items.length > 100) {
    return { success: false, error: "An invoice cannot have more than 100 items" };
  }

  const validatedItems: ValidatedInvoiceItem[] = [];
  let calculatedSubtotal = 0;

  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i];
    if (!it || typeof it !== "object") {
      return { success: false, error: `Item #${i + 1} is invalid` };
    }

    const description = typeof it.description === "string" ? it.description.trim() : "";
    if (!description) {
      return { success: false, error: `Item #${i + 1}: Description is required` };
    }

    const quantity = Number(it.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { success: false, error: `Item #${i + 1}: Quantity must be greater than zero` };
    }

    const rate = Number(it.rate);
    if (!Number.isFinite(rate) || rate < 0) {
      return { success: false, error: `Item #${i + 1}: Rate must be a non-negative number` };
    }

    const gstRate = Number(it.gstRate);
    if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) {
      return { success: false, error: `Item #${i + 1}: GST rate must be between 0% and 100%` };
    }

    const amount = round2(quantity * rate);
    const hsn = typeof it.hsn === "string" ? it.hsn.trim() : undefined;

    calculatedSubtotal = round2(calculatedSubtotal + amount);

    validatedItems.push({
      sortOrder: i,
      description,
      hsn: hsn || undefined,
      quantity,
      rate,
      gstRate,
      amount,
    });
  }

  const customerGst = typeof body.customerGst === "string" ? body.customerGst.trim().toUpperCase() : "";
  const discount = Math.max(0, round2(Number(body.discount) || 0));
  const isInterState = typeof body.isInterState === "boolean" ? body.isInterState : undefined;

  // Authoritative product-wise calculation
  const gstCalc = calculateInvoiceGst(validatedItems, {
    customerGst,
    discount,
    isInterState,
  });

  const subtotal = gstCalc.subtotal;
  const gstAmount = gstCalc.totalGst;

  if (discount > subtotal) {
    return { success: false, error: "Discount cannot exceed subtotal amount" };
  }

  // Preserve whole-rupee rounding or exact 2-decimal total
  let totalAmount = gstCalc.totalAmount;
  if (Number.isFinite(Number(body.totalAmount))) {
    const candidate = round2(Number(body.totalAmount));
    if (candidate === gstCalc.totalAmount || candidate === gstCalc.roundedTotalAmount) {
      totalAmount = candidate;
    }
  }

  const amountPaid = Math.max(0, round2(Number(body.amountPaid) || 0));

  if (amountPaid > totalAmount && totalAmount > 0) {
    return { success: false, error: "Amount paid cannot exceed total invoice amount" };
  }

  const validStatuses = ["UNPAID", "PARTIALLY PAID", "PAID"];
  const paymentStatus = validStatuses.includes(body.paymentStatus) ? body.paymentStatus : (amountPaid >= totalAmount && totalAmount > 0 ? "PAID" : amountPaid > 0 ? "PARTIALLY PAID" : "UNPAID");

  return {
    success: true,
    data: {
      invoiceNumber,
      quotationId: typeof body.quotationId === "string" ? body.quotationId : null,
      invoiceDate,
      dueDate,
      customerName,
      customerAddress: typeof body.customerAddress === "string" ? body.customerAddress.trim() : "",
      customerMobile: typeof body.customerMobile === "string" ? body.customerMobile.trim() : "",
      customerGst: typeof body.customerGst === "string" ? body.customerGst.trim().toUpperCase() : "",
      subtotal,
      gstAmount,
      discount,
      totalAmount,
      amountPaid,
      paymentStatus,
      paymentMethod: typeof body.paymentMethod === "string" && body.paymentMethod.trim() ? body.paymentMethod.trim() : "Bank Transfer",
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
      accountName: typeof body.accountName === "string" ? body.accountName.trim() : undefined,
      bankName: typeof body.bankName === "string" ? body.bankName.trim() : undefined,
      accountNumber: typeof body.accountNumber === "string" ? body.accountNumber.trim() : undefined,
      ifscCode: typeof body.ifscCode === "string" ? body.ifscCode.trim() : undefined,
      branch: typeof body.branch === "string" ? body.branch.trim() : undefined,
      upiId: typeof body.upiId === "string" ? body.upiId.trim() : undefined,
      items: validatedItems,
    },
  };
}

export interface ValidatedQuotationItem {
  sortOrder: number;
  component: string;
  specification: string;
  brandModel: string;
  quantity: string;
}

export interface ValidatedQuotationInput {
  date: string;
  customerName: string;
  proposedSystem: string;
  connectionType: string;
  systemCapacity: string;
  estimatedGeneration: string;
  validityDays: number;
  totalAmount: number;
  gstInclusive: boolean;
  investmentNote: string;
  showDocumentsRequired?: boolean;
  showBankDetails?: boolean;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  branch?: string;
  accountName?: string;
  items: ValidatedQuotationItem[];
}

export function validateQuotationPayload(body: any): ValidationResult<ValidatedQuotationInput> {
  if (!body || typeof body !== "object") {
    return { success: false, error: "Invalid request payload" };
  }

  const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
  if (!customerName) {
    return { success: false, error: "Customer name is required" };
  }
  if (customerName.length > 200) {
    return { success: false, error: "Customer name cannot exceed 200 characters" };
  }

  const date = typeof body.date === "string" ? body.date.trim() : "";
  if (!date) {
    return { success: false, error: "Quotation date is required" };
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return { success: false, error: "At least one component item is required in the quotation" };
  }

  const validatedItems: ValidatedQuotationItem[] = [];
  for (let i = 0; i < body.items.length; i++) {
    const it = body.items[i];
    if (!it || typeof it !== "object") {
      return { success: false, error: `Item #${i + 1} is invalid` };
    }

    const component = typeof it.component === "string" ? it.component.trim() : "";
    if (!component) {
      return { success: false, error: `Item #${i + 1}: Component name is required` };
    }

    validatedItems.push({
      sortOrder: i,
      component,
      specification: typeof it.specification === "string" ? it.specification.trim() : "",
      brandModel: typeof it.brandModel === "string" ? it.brandModel.trim() : "",
      quantity: typeof it.quantity === "string" ? it.quantity.trim() : String(it.quantity || "1"),
    });
  }

  const validityDays = Number.isInteger(Number(body.validityDays)) && Number(body.validityDays) > 0 && Number(body.validityDays) <= 365
    ? Number(body.validityDays)
    : 15;

  const totalAmount = Number(body.totalAmount);
  if (!Number.isFinite(totalAmount) || totalAmount < 0) {
    return { success: false, error: "Total amount must be a non-negative number" };
  }

  return {
    success: true,
    data: {
      date,
      customerName,
      proposedSystem: typeof body.proposedSystem === "string" && body.proposedSystem.trim() ? body.proposedSystem.trim() : "On-Grid Rooftop Solar",
      connectionType: typeof body.connectionType === "string" && body.connectionType.trim() ? body.connectionType.trim() : "LT 1-Phase Grid Connected",
      systemCapacity: typeof body.systemCapacity === "string" ? body.systemCapacity.trim() : String(body.systemCapacity || "3.00 kW"),
      estimatedGeneration: typeof body.estimatedGeneration === "string" ? body.estimatedGeneration.trim() : String(body.estimatedGeneration || "360-400 Units / Month"),
      validityDays,
      totalAmount: Math.round(totalAmount * 100) / 100,
      gstInclusive: body.gstInclusive ?? true,
      investmentNote: typeof body.investmentNote === "string" && body.investmentNote.trim()
        ? body.investmentNote.trim()
        : "Includes all materials, transport, installation & net-metering support.",
      showDocumentsRequired: body.showDocumentsRequired !== false,
      showBankDetails: body.showBankDetails !== false,
      bankName: typeof body.bankName === "string" ? body.bankName.trim() : undefined,
      accountNumber: typeof body.accountNumber === "string" ? body.accountNumber.trim() : undefined,
      ifscCode: typeof body.ifscCode === "string" ? body.ifscCode.trim().toUpperCase() : undefined,
      branch: typeof body.branch === "string" ? body.branch.trim() : undefined,
      accountName: typeof body.accountName === "string" ? body.accountName.trim() : undefined,
      items: validatedItems,
    },
  };
}
