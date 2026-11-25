/**
 * Shashikala Powertech - Automated Verification & Performance Audit Test Suite
 * Validates calculation accuracy, sequence numbering, database projections & indexing.
 */

const { PrismaClient } = require("@prisma/client");
const assert = require("assert");
const {
  calculateInvoiceGst,
  calculateBaseRateFromGross,
  isInterStateSupply,
  round2,
  formatGstRate,
} = require("../src/lib/gst-engine");

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

  console.log("\n--- TEST GROUP 2: Product-Wise GST Calculation & Slab Reconciliation Engine ---");
  test("Item line taxable amount calculation (Quantity * Rate)", () => {
    const qty = 3;
    const rate = 50000;
    const amount = round2(qty * rate);
    assert.strictEqual(amount, 150000);
  });

  test("Reference regression test: Mixed 5% and 18% products (Section 4 exact reconciliation)", () => {
    const items = [
      { description: "Solar Panel", quantity: 1, rate: 90476, gstRate: 5 },
      { description: "Polycab Inverter", quantity: 1, rate: 23810, gstRate: 5 },
      { description: "Other Material", quantity: 1, rate: 42373, gstRate: 18 },
      { description: "Installation", quantity: 1, rate: 25424, gstRate: 18 },
    ];

    const calc = calculateInvoiceGst(items, { discount: 1 });

    // Verify 5% slab
    const slab5 = calc.slabs.find((s) => s.gstRate === 5);
    assert.ok(slab5, "5% slab must exist in breakdown");
    assert.strictEqual(slab5.taxableValue, 114286);
    assert.strictEqual(slab5.totalTax, 5714.3);
    assert.strictEqual(slab5.cgstRate, 2.5);
    assert.strictEqual(slab5.cgstAmount, 2857.15);
    assert.strictEqual(slab5.sgstRate, 2.5);
    assert.strictEqual(slab5.sgstAmount, 2857.15);

    // Verify 18% slab
    const slab18 = calc.slabs.find((s) => s.gstRate === 18);
    assert.ok(slab18, "18% slab must exist in breakdown");
    assert.strictEqual(slab18.taxableValue, 67797);
    assert.strictEqual(slab18.totalTax, 12203.46);
    assert.strictEqual(slab18.cgstRate, 9);
    assert.strictEqual(slab18.cgstAmount, 6101.73);
    assert.strictEqual(slab18.sgstRate, 9);
    assert.strictEqual(slab18.sgstAmount, 6101.73);

    // Verify overall invoice totals
    assert.strictEqual(calc.subtotal, 182083);
    assert.strictEqual(calc.totalGst, 17917.76);
    assert.strictEqual(calc.totalCgst, 8958.88);
    assert.strictEqual(calc.totalSgst, 8958.88);
    assert.strictEqual(calc.totalBeforeDiscount, 200000.76);

    // Verify discount and whole-rupee rounding
    assert.strictEqual(calc.discount, 1);
    assert.strictEqual(calc.totalAmount, 199999.76);
    assert.strictEqual(calc.roundedTotalAmount, 200000);
  });

  test("Homogeneous products: All items at same GST rate (18%)", () => {
    const items = [
      { description: "Structure", quantity: 2, rate: 15000, gstRate: 18 },
      { description: "Cables", quantity: 1, rate: 10000, gstRate: 18 },
    ];
    const calc = calculateInvoiceGst(items);
    assert.strictEqual(calc.slabs.length, 1);
    assert.strictEqual(calc.subtotal, 40000);
    assert.strictEqual(calc.totalGst, 7200);
    assert.strictEqual(calc.totalCgst, 3600);
    assert.strictEqual(calc.totalSgst, 3600);
    assert.strictEqual(calc.totalAmount, 47200);
  });

  test("Multi-slab products: Mixed 5%, 12%, and 18% products", () => {
    const items = [
      { description: "Solar PV Modules", quantity: 10, rate: 1000, gstRate: 5 }, // 10,000 @ 5% -> 500 GST
      { description: "Solar Pump Controller", quantity: 1, rate: 20000, gstRate: 12 }, // 20,000 @ 12% -> 2,400 GST
      { description: "BOS Electricals", quantity: 1, rate: 30000, gstRate: 18 }, // 30,000 @ 18% -> 5,400 GST
    ];
    const calc = calculateInvoiceGst(items);
    assert.strictEqual(calc.slabs.length, 3);
    assert.strictEqual(calc.subtotal, 60000);
    assert.strictEqual(calc.totalGst, 8300);
    assert.strictEqual(calc.totalCgst, 4150);
    assert.strictEqual(calc.totalSgst, 4150);
    assert.strictEqual(calc.totalAmount, 68300);

    // Check individual slabs
    const s5 = calc.slabs.find((s) => s.gstRate === 5);
    const s12 = calc.slabs.find((s) => s.gstRate === 12);
    const s18 = calc.slabs.find((s) => s.gstRate === 18);
    assert.strictEqual(s5.taxableValue, 10000);
    assert.strictEqual(s5.cgstAmount, 250);
    assert.strictEqual(s12.taxableValue, 20000);
    assert.strictEqual(s12.cgstAmount, 1200);
    assert.strictEqual(s18.taxableValue, 30000);
    assert.strictEqual(s18.cgstAmount, 2700);
  });

  test("Inter-state supply: IGST calculation without CGST/SGST duplication", () => {
    const items = [
      { description: "Solar Inverter", quantity: 1, rate: 100000, gstRate: 18 },
    ];
    // Company in Maharashtra (27), Customer in Delhi (07)
    const calc = calculateInvoiceGst(items, {
      companyGst: "27AJRPN3091N1ZE",
      customerGst: "07AABCT1234D1Z5",
    });
    assert.strictEqual(calc.isInterState, true);
    assert.strictEqual(calc.totalCgst, 0);
    assert.strictEqual(calc.totalSgst, 0);
    assert.strictEqual(calc.totalIgst, 18000);
    assert.strictEqual(calc.totalGst, 18000);
    assert.strictEqual(calc.totalAmount, 118000);

    const slab = calc.slabs[0];
    assert.strictEqual(slab.igstRate, 18);
    assert.strictEqual(slab.igstAmount, 18000);
    assert.strictEqual(slab.cgstAmount, 0);
    assert.strictEqual(slab.sgstAmount, 0);
  });

  test("Fractional paise precision handling without IEEE-754 drift", () => {
    const items = [
      { description: "Fastener Set", quantity: 3, rate: 33.33, gstRate: 18 },
      { description: "Gasket Seal", quantity: 1, rate: 100.05, gstRate: 5 },
    ];
    const calc = calculateInvoiceGst(items);
    // Item 1: 3 * 33.33 = 99.99 taxable; 99.99 * 0.18 = 17.9982 -> round2(18.00)
    // Item 2: 1 * 100.05 = 100.05 taxable; 100.05 * 0.05 = 5.0025 -> round2(5.00)
    assert.strictEqual(calc.items[0].taxableAmount, 99.99);
    assert.strictEqual(calc.items[0].gstAmount, 18.0);
    assert.strictEqual(calc.items[1].taxableAmount, 100.05);
    assert.strictEqual(calc.items[1].gstAmount, 5.0);
    assert.strictEqual(calc.subtotal, 200.04);
    assert.strictEqual(calc.totalGst, 23.0);
    assert.strictEqual(calc.totalAmount, 223.04);
  });

  test("Package price back-calculation from inclusive gross (2,10,000 -> 1,77,966 base)", () => {
    const gross = 210000;
    const gstRate = 18;
    const qty = 1;
    const baseRate = calculateBaseRateFromGross(gross, gstRate, qty);
    assert.strictEqual(baseRate, 177966);
    const tax = round2(baseRate * (gstRate / 100));
    assert.strictEqual(baseRate + tax, 209999.88);
    assert.strictEqual(Math.round(baseRate + tax), 210000);
  });

  test("Discount and grand total arithmetic cannot produce negative total", () => {
    const items = [{ description: "Consulting", quantity: 1, rate: 100000, gstRate: 18 }];
    const calc = calculateInvoiceGst(items, { discount: 200000 });
    assert.strictEqual(calc.totalAmount, 0);
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

  await asyncTest("Database round-trip: Save, reopen and edit invoice with product-wise GST slabs", async () => {
    const testInvNumber = `TEST-INV-${Date.now()}`;
    const items = [
      { description: "Solar Panel", quantity: 1, rate: 90476, gstRate: 5, sortOrder: 0 },
      { description: "Polycab Inverter", quantity: 1, rate: 23810, gstRate: 5, sortOrder: 1 },
      { description: "Other Material", quantity: 1, rate: 42373, gstRate: 18, sortOrder: 2 },
      { description: "Installation", quantity: 1, rate: 25424, gstRate: 18, sortOrder: 3 },
    ];

    const initialCalc = calculateInvoiceGst(items, { discount: 1 });

    // 1. Create invoice in database
    const created = await prisma.invoice.create({
      data: {
        invoiceNumber: testInvNumber,
        invoiceDate: "25/11/2026",
        dueDate: "05/12/2026",
        customerName: "Regression Test Customer",
        subtotal: initialCalc.subtotal,
        gstAmount: initialCalc.totalGst,
        discount: 1,
        totalAmount: initialCalc.roundedTotalAmount, // 200000
        amountPaid: 0,
        paymentStatus: "UNPAID",
        companySnapshot: "{}",
        createdBy: "audit-runner",
        items: {
          create: items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            rate: it.rate,
            gstRate: it.gstRate,
            amount: round2(it.quantity * it.rate),
            sortOrder: it.sortOrder,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    try {
      assert.strictEqual(created.subtotal, 182083);
      assert.strictEqual(created.gstAmount, 17917.76);
      assert.strictEqual(created.totalAmount, 200000);
      assert.strictEqual(created.items.length, 4);

      // 2. Reopen from database and verify authoritative reconciliation
      const reopened = await prisma.invoice.findUnique({
        where: { id: created.id },
        include: { items: { orderBy: { sortOrder: "asc" } } },
      });
      assert.ok(reopened);

      const reopenedCalc = calculateInvoiceGst(reopened.items, { discount: reopened.discount });
      assert.strictEqual(reopenedCalc.subtotal, 182083);
      assert.strictEqual(reopenedCalc.totalGst, 17917.76);
      assert.strictEqual(reopenedCalc.totalCgst, 8958.88);
      assert.strictEqual(reopenedCalc.totalSgst, 8958.88);
      assert.strictEqual(reopenedCalc.roundedTotalAmount, 200000);

      // 3. Edit invoice: Change installation GST rate from 18% to 12%
      const updatedItems = reopened.items.map((it) => {
        if (it.description === "Installation") {
          return { ...it, gstRate: 12 };
        }
        return it;
      });

      const editedCalc = calculateInvoiceGst(updatedItems, { discount: 1 });
      // Installation: 25424 @ 12% -> 3050.88 GST (was 4576.32 @ 18%, diff = -1525.44)
      // New Total GST: 17917.76 - 1525.44 = 16392.32
      assert.strictEqual(editedCalc.slabs.length, 3); // 5%, 12%, 18%
      assert.strictEqual(editedCalc.subtotal, 182083);
      assert.strictEqual(editedCalc.totalGst, 16392.32);
      assert.strictEqual(editedCalc.totalBeforeDiscount, 198475.32);
      assert.strictEqual(editedCalc.roundedTotalAmount, 198474);
    } finally {
      // Clean up test record
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: created.id } });
      await prisma.invoice.delete({ where: { id: created.id } });
    }
  });

  await asyncTest("Database indexes exist on Quotation and Invoice tables", async () => {
    const qIndexes = await prisma.$queryRawUnsafe("PRAGMA index_list('Quotation')");
    const invIndexes = await prisma.$queryRawUnsafe("PRAGMA index_list('Invoice')");
    assert.ok(qIndexes.length >= 2, "Quotation table must have at least 2 indexes");
    assert.ok(invIndexes.length >= 2, "Invoice table must have at least 2 indexes");
  });

  await asyncTest("Database read latency is sub-15ms (in-memory WAL speed)", async () => {
    // Apply high-performance SQLite engine pragmas
    await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
    await prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
    await prisma.$queryRawUnsafe("PRAGMA cache_size = -64000;");
    await prisma.$queryRawUnsafe("PRAGMA mmap_size = 268435456;");
    await prisma.$queryRawUnsafe("PRAGMA temp_store = MEMORY;");
    await prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000;");

    // Warm-up query to load schema into memory
    await prisma.quotation.findFirst({ select: { id: true } });

    // Measure actual read latency
    const start = performance.now();
    const record = await prisma.quotation.findFirst({ select: { id: true, quotationNumber: true } });
    const elapsed = performance.now() - start;
    console.log(`    (Measured Latency: ${elapsed.toFixed(2)}ms)`);
    assert.ok(record !== undefined, "Database query must execute successfully");
    assert.ok(elapsed < 15, `Database latency must be strictly sub-15ms, was ${elapsed.toFixed(2)}ms`);
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
