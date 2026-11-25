/**
 * Shashikala Power Tech — Authoritative GST Calculation & Slab Reconciliation Engine
 * Pure CommonJS core engine for universal Node.js and Next.js compatibility.
 */

function round2(num) {
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
}

function isInterStateSupply(companyGst, customerGst, explicitInterState) {
  if (typeof explicitInterState === "boolean") {
    return explicitInterState;
  }

  const cleanCustGst = typeof customerGst === "string" ? customerGst.trim().toUpperCase() : "";
  if (cleanCustGst.length >= 2) {
    const custStateCode = cleanCustGst.substring(0, 2);
    if (/^\d{2}$/.test(custStateCode)) {
      const cleanCompGst =
        typeof companyGst === "string" && companyGst.trim()
          ? companyGst.trim().toUpperCase()
          : "27AJRPN3091N1ZE";
      const compStateCode = cleanCompGst.substring(0, 2);
      if (/^\d{2}$/.test(compStateCode)) {
        return custStateCode !== compStateCode;
      }
    }
  }

  return false;
}

function calculateLineItemGst(item, isInterState = false) {
  const quantity = Math.max(0, Number(item.quantity) || 0);
  const rate = Math.max(0, Number(item.rate) || 0);
  const gstRate = Math.max(0, Math.min(100, Number(item.gstRate) || 0));

  const taxableAmount = round2(quantity * rate);
  const gstAmount = round2(taxableAmount * (gstRate / 100));

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;

  if (isInterState) {
    igstRate = gstRate;
    igstAmount = gstAmount;
  } else {
    cgstRate = round2(gstRate / 2);
    sgstRate = round2(gstRate / 2);
    cgstAmount = round2(gstAmount / 2);
    sgstAmount = round2(gstAmount - cgstAmount);
  }

  return {
    id: item.id,
    description: typeof item.description === "string" ? item.description : "",
    hsn: typeof item.hsn === "string" ? item.hsn : undefined,
    quantity,
    rate,
    gstRate,
    taxableAmount,
    gstAmount,
    cgstRate,
    cgstAmount,
    sgstRate,
    sgstAmount,
    igstRate,
    igstAmount,
    per: item.per,
  };
}

function calculateInvoiceGst(items, options) {
  const isInterState = isInterStateSupply(
    options?.companyGst,
    options?.customerGst,
    options?.isInterState
  );

  const calculatedItems = [];
  const slabMap = new Map();

  let subtotal = 0;
  let totalGst = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  for (const rawItem of items || []) {
    const calcItem = calculateLineItemGst(rawItem, isInterState);
    calculatedItems.push(calcItem);

    subtotal = round2(subtotal + calcItem.taxableAmount);
    totalGst = round2(totalGst + calcItem.gstAmount);
    totalCgst = round2(totalCgst + calcItem.cgstAmount);
    totalSgst = round2(totalSgst + calcItem.sgstAmount);
    totalIgst = round2(totalIgst + calcItem.igstAmount);

    const slabKey = calcItem.gstRate;
    const existing = slabMap.get(slabKey);

    if (existing) {
      existing.taxableValue = round2(existing.taxableValue + calcItem.taxableAmount);
      existing.totalTax = round2(existing.totalTax + calcItem.gstAmount);
      existing.cgstAmount = round2(existing.cgstAmount + calcItem.cgstAmount);
      existing.sgstAmount = round2(existing.sgstAmount + calcItem.sgstAmount);
      existing.igstAmount = round2(existing.igstAmount + calcItem.igstAmount);
    } else {
      slabMap.set(slabKey, {
        gstRate: slabKey,
        taxableValue: calcItem.taxableAmount,
        cgstRate: isInterState ? 0 : round2(slabKey / 2),
        cgstAmount: calcItem.cgstAmount,
        sgstRate: isInterState ? 0 : round2(slabKey / 2),
        sgstAmount: calcItem.sgstAmount,
        igstRate: isInterState ? slabKey : 0,
        igstAmount: calcItem.igstAmount,
        totalTax: calcItem.gstAmount,
      });
    }
  }

  const slabs = Array.from(slabMap.values()).sort((a, b) => a.gstRate - b.gstRate);

  const rawDiscount = Number(options?.discount);
  const discount = Number.isFinite(rawDiscount) && rawDiscount > 0 ? round2(rawDiscount) : 0;

  const totalBeforeDiscount = round2(subtotal + totalGst);
  const totalAmount = Math.max(0, round2(totalBeforeDiscount - discount));
  const roundedTotalAmount = Math.round(totalAmount);
  const roundOff = round2(roundedTotalAmount - totalAmount);

  const effectiveGstRate = subtotal > 0 ? round2((totalGst / subtotal) * 100) : 0;

  return {
    isInterState,
    items: calculatedItems,
    slabs,
    subtotal,
    totalGst,
    totalCgst,
    totalSgst,
    totalIgst,
    totalBeforeDiscount,
    discount,
    totalAmount,
    roundedTotalAmount,
    roundOff,
    effectiveGstRate,
  };
}

function calculateBaseRateFromGross(grossAmount, gstRate = 18, quantity = 1) {
  const safeGross = Math.max(0, Number(grossAmount) || 0);
  const g = Math.max(0, Number(gstRate) || 0);
  const q = Math.max(1, Number(quantity) || 1);
  const gstFactor = 1 + g / 100;
  return Math.round(safeGross / gstFactor / q);
}

function formatGstRate(rate) {
  const formatted = Number(rate).toFixed(1).replace(/\.0$/, "");
  return `${formatted}%`;
}

module.exports = {
  round2,
  isInterStateSupply,
  calculateLineItemGst,
  calculateInvoiceGst,
  calculateBaseRateFromGross,
  formatGstRate,
};
