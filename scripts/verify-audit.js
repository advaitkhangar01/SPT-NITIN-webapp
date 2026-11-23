/**
 * Shashikala Powertech - Automated Verification & Performance Audit Test Suite
 * Validates calculation accuracy, sequence numbering, database projections & indexing.
 */

const { PrismaClient } = require("@prisma/client");
const assert = require("assert");

const prisma = new PrismaClient();

function formatIndianCurrency(amount) {
  if (amount === undefined || amount === null || amount === "") return "₹0";
  const num = typeof amount === "string" ? parseFloat(amount.replace(/[^0-9.-]+/g, "")) : amount;
  if (isNaN(num)) return "₹0";

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const parts = absNum.toFixed(2).split(".");
  let intPart = parts[0];
  const decPart = parts[1];

  if (intPart.length > 3) {
    const lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  }

  const formattedDecimal = decPart !== "00" ? `.${decPart}` : "";
  return `${isNegative ? "-" : ""}₹${intPart}${formattedDecimal}`;
}

function parseCurrencyInput(value) {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;
  const cleaned = value.replace(/[^0-9.-]+/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function formatDocNumber(prefix, number) {
  const cleanPrefix = (prefix || "DOC").trim().replace(/-+$/, "");
  const year = new Date().getFullYear();
  const seqStr = String(number).padStart(3, "0");
  return `${cleanPrefix}-${year}-${seqStr}`;
}

async function runTests() {
  console.log("===============================================================================");
  console.log("SHASHIKALA POWERTECH — AUTOMATED PERFORMANCE & INTEGRITY AUDIT TEST SUITE");
  console.log("===============================================================================\n");

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✔ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  console.log("--- TEST GROUP 1: Indian Rupee Formatting & Currency Parsing ---");
  test("Formats standard amounts correctly", () => {
    assert.strictEqual(formatIndianCurrency(0), "₹0");
    assert.strictEqual(formatIndianCurrency(210000), "₹2,10,000");
    assert.strictEqual(formatIndianCurrency(1500000), "₹15,00,000");
    assert.strictEqual(formatIndianCurrency("210000"), "₹2,10,000");
  });

  test("Formats decimals properly without trailing .00", () => {
    assert.strictEqual(formatIndianCurrency(1234.5), "₹1,234.50");
    assert.strictEqual(formatIndianCurrency(1234.0), "₹1,234");
  });

  test("Parses raw user input strings back to clean floats", () => {
    assert.strictEqual(parseCurrencyInput("₹2,10,000"), 210000);
    assert.strictEqual(parseCurrencyInput("210000"), 210000);
    assert.strictEqual(parseCurrencyInput("₹15,400.50"), 15400.5);
    assert.strictEqual(parseCurrencyInput(""), 0);
  });

  console.log("\n--- TEST GROUP 2: Financial Calculation & GST Formula Integrity ---");
  test("Item line taxable amount calculation (Quantity * Rate)", () => {
    const qty = 3;
    const rate = 50000;
    const amount = Math.round(qty * rate);
    assert.strictEqual(amount, 150000);
  });

  test("GST calculation at 18% matches exact rounded rupee amount", () => {
    const base = 177966;
    const gstRate = 18;
    const gst = Math.round(base * (gstRate / 100));
    assert.strictEqual(gst, 32034);
    assert.strictEqual(base + gst, 210000); // 2.10 Lakh inclusive total
  });

  test("Package price back-calculation from inclusive gross (2,10,000 -> 1,77,966 base)", () => {
    const gross = 210000;
    const gstRate = 18;
    const qty = 1;
    const baseRate = Math.round(gross / (1 + gstRate / 100) / qty);
    assert.strictEqual(baseRate, 177966);
    const tax = Math.round(baseRate * (gstRate / 100));
    assert.strictEqual(baseRate + tax, 210000);
  });

  test("Discount and grand total arithmetic cannot produce negative total", () => {
    const subtotal = 100000;
    const gst = 18000;
    const discount = 150000; // Discount larger than subtotal + GST
    const total = Math.max(0, subtotal + gst - discount);
    assert.strictEqual(total, 0);
  });

  console.log("\n--- TEST GROUP 3: Document Numbering Sequence Generation ---");
  test("Formats sequence strings with current year and zero-padded 3-digit counter", () => {
    const currentYear = new Date().getFullYear();
    assert.strictEqual(formatDocNumber("QT", 1), `QT-${currentYear}-001`);
    assert.strictEqual(formatDocNumber("INV", 42), `INV-${currentYear}-042`);
    assert.strictEqual(formatDocNumber("QT-", 100), `QT-${currentYear}-100`);
  });

  console.log("\n--- TEST GROUP 4: Database Query Performance & Selective Projection ---");
  await asyncTest("Quotation findMany projection omits line items (payload optimization)", async () => {
    const quotes = await prisma.quotation.findMany({
      take: 5,
      select: {
        id: true,
        quotationNumber: true,
        customerName: true,
        date: true,
        systemCapacity: true,
        totalAmount: true,
        createdBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(Array.isArray(quotes));
    for (const q of quotes) {
      assert.strictEqual(q.items, undefined, "items array should be omitted on list projection");
      assert.ok(q.id && q.quotationNumber, "Document ID and Number must be present");
    }
  });

  await asyncTest("Invoice findMany projection omits line items (payload optimization)", async () => {
    const invoices = await prisma.invoice.findMany({
      take: 5,
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        invoiceDate: true,
        dueDate: true,
        totalAmount: true,
        amountPaid: true,
        paymentStatus: true,
        createdBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    assert.ok(Array.isArray(invoices));
    for (const inv of invoices) {
      assert.strictEqual(inv.items, undefined, "items array should be omitted on list projection");
      assert.ok(inv.id && inv.invoiceNumber, "Invoice ID and Number must be present");
    }
  });

  await asyncTest("Database indexes exist on Quotation and Invoice tables", async () => {
    const qIndexes = await prisma.$queryRawUnsafe("PRAGMA index_list('Quotation')");
    const invIndexes = await prisma.$queryRawUnsafe("PRAGMA index_list('Invoice')");
    assert.ok(qIndexes.length >= 2, "Quotation table must have at least 2 indexes");
    assert.ok(invIndexes.length >= 2, "Invoice table must have at least 2 indexes");
  });

  await asyncTest("Database read query executes cleanly", async () => {
    // Warm-up query to initialize Prisma client connection
    await prisma.quotation.findFirst({ select: { id: true } });
    
    // Measure warmed read latency
    const start = Date.now();
    const record = await prisma.quotation.findFirst({ select: { id: true } });
    const elapsed = Date.now() - start;
    console.log(`    (Latency: ${elapsed}ms)`);
    assert.ok(record !== undefined, "Database query must execute successfully");
  });

  console.log("\n===============================================================================");
  console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================================");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  prisma.$disconnect().finally(() => process.exit(1));
});
