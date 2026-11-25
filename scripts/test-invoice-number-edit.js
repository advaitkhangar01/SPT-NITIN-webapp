/**
 * Test script for verifying editable invoice numbers
 * Tests validation, uniqueness enforcement, and update logic.
 */
const { PrismaClient } = require("@prisma/client");
const assert = require("assert");
const { validateInvoicePayload } = require("../src/lib/validations.ts");

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== Testing Invoice Number Edit Logic ===\n");

  // A. Unit tests for validateInvoicePayload
  console.log("--- A. Testing validateInvoicePayload ---");
  const basePayload = {
    customerName: "Acme Corp",
    invoiceDate: "25/11/2026",
    items: [
      {
        description: "Solar Inverter",
        quantity: 1,
        rate: 50000,
        gstRate: 18,
      },
    ],
  };

  // 1. Omitted invoiceNumber -> success, invoiceNumber is undefined
  const omittedRes = validateInvoicePayload({ ...basePayload });
  assert.strictEqual(omittedRes.success, true);
  assert.strictEqual(omittedRes.data.invoiceNumber, undefined);
  console.log("✓ Omitted invoiceNumber passes and yields undefined.");

  // 2. Valid custom invoiceNumber -> trimmed
  const validRes = validateInvoicePayload({
    ...basePayload,
    invoiceNumber: "  INV-2026-CUSTOM-001  ",
  });
  assert.strictEqual(validRes.success, true);
  assert.strictEqual(validRes.data.invoiceNumber, "INV-2026-CUSTOM-001");
  console.log("✓ Valid invoiceNumber is accepted and trimmed.");

  // 3. Empty string invoiceNumber -> error
  const emptyRes = validateInvoicePayload({
    ...basePayload,
    invoiceNumber: "   ",
  });
  assert.strictEqual(emptyRes.success, false);
  assert.ok(emptyRes.error.includes("Invoice number cannot be empty"));
  console.log("✓ Empty string invoiceNumber is rejected.");

  // 4. Overlong invoiceNumber (> 50 chars) -> error
  const longRes = validateInvoicePayload({
    ...basePayload,
    invoiceNumber: "A".repeat(51),
  });
  assert.strictEqual(longRes.success, false);
  assert.ok(longRes.error.includes("cannot exceed 50 characters"));
  console.log("✓ Overlong invoiceNumber is rejected.");

  // 5. Non-string invoiceNumber -> error
  const nonStringRes = validateInvoicePayload({
    ...basePayload,
    invoiceNumber: 12345,
  });
  assert.strictEqual(nonStringRes.success, false);
  assert.ok(nonStringRes.error.includes("must be a text value"));
  console.log("✓ Non-string invoiceNumber is rejected.");

  // B. Database collision and update tests
  console.log("\n--- B. Testing Database Uniqueness and Updates ---");
  const testSuffix = Date.now().toString().slice(-6);
  const testNumA = `INV-TEST-A-${testSuffix}`;
  const testNumB = `INV-TEST-B-${testSuffix}`;
  const testNumC = `INV-TEST-C-${testSuffix}`;

  let invoiceA = null;
  let invoiceB = null;

  try {
    // 1. Create Invoice A
    console.log("1. Creating test invoice A with number:", testNumA);
    invoiceA = await prisma.invoice.create({
      data: {
        invoiceNumber: testNumA,
        invoiceDate: "25/11/2026",
        dueDate: "05/12/2026",
        customerName: "Test Customer A",
        customerAddress: "Test Address",
        customerMobile: "9999999999",
        customerGst: "",
        subtotal: 1000,
        gstAmount: 180,
        discount: 0,
        totalAmount: 1180,
        amountPaid: 0,
        paymentStatus: "UNPAID",
        paymentMethod: "Bank Transfer",
        notes: "Test invoice A",
        companySnapshot: "{}",
        createdBy: "SYSTEM",
        items: {
          create: [
            {
              sortOrder: 0,
              description: "Test Item",
              quantity: 1,
              rate: 1000,
              gstRate: 18,
              amount: 1180,
            },
          ],
        },
      },
    });
    assert.strictEqual(invoiceA.invoiceNumber, testNumA);
    console.log("✓ Invoice A created successfully.");

    // 2. Create Invoice B
    console.log("2. Creating test invoice B with number:", testNumB);
    invoiceB = await prisma.invoice.create({
      data: {
        invoiceNumber: testNumB,
        invoiceDate: "25/11/2026",
        dueDate: "05/12/2026",
        customerName: "Test Customer B",
        customerAddress: "Test Address",
        customerMobile: "8888888888",
        customerGst: "",
        subtotal: 500,
        gstAmount: 90,
        discount: 0,
        totalAmount: 590,
        amountPaid: 0,
        paymentStatus: "UNPAID",
        paymentMethod: "Bank Transfer",
        notes: "Test invoice B",
        companySnapshot: "{}",
        createdBy: "SYSTEM",
        items: {
          create: [
            {
              sortOrder: 0,
              description: "Test Item B",
              quantity: 1,
              rate: 500,
              gstRate: 18,
              amount: 590,
            },
          ],
        },
      },
    });
    assert.strictEqual(invoiceB.invoiceNumber, testNumB);
    console.log("✓ Invoice B created successfully.");

    // 3. Test duplicate collision check:
    console.log("3. Testing duplicate collision check for existing invoices...");
    const duplicateCheck = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: testNumB,
        NOT: { id: invoiceA.id },
      },
    });
    assert.ok(duplicateCheck, "Duplicate check must find existing invoice B");
    console.log("✓ Duplicate conflict correctly detected.");

    // 4. Test self check (unchanged number):
    const selfCheck = await prisma.invoice.findFirst({
      where: {
        invoiceNumber: testNumA,
        NOT: { id: invoiceA.id },
      },
    });
    assert.strictEqual(selfCheck, null, "Self-check must NOT flag the same invoice as duplicate");
    console.log("✓ Self-check correctly permits keeping current invoice number.");

    // 5. Test updating invoice A to a new unique number (testNumC):
    console.log("5. Updating invoice A to new number:", testNumC);
    const updatedA = await prisma.invoice.update({
      where: { id: invoiceA.id },
      data: { invoiceNumber: testNumC },
    });
    assert.strictEqual(updatedA.invoiceNumber, testNumC);

    const reloadedA = await prisma.invoice.findUnique({
      where: { id: invoiceA.id },
    });
    assert.strictEqual(reloadedA.invoiceNumber, testNumC);
    console.log("✓ Invoice A successfully updated to new number in DB.");

    console.log("\nAll invoice number edit logic and validation tests passed!");
  } finally {
    // Cleanup
    if (invoiceA) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoiceA.id } }).catch(() => {});
      await prisma.invoice.delete({ where: { id: invoiceA.id } }).catch(() => {});
    }
    if (invoiceB) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoiceB.id } }).catch(() => {});
      await prisma.invoice.delete({ where: { id: invoiceB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
