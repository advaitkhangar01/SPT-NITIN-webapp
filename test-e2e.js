const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function formatDocNumber(prefix, number) {
  const cleanPrefix = (prefix || "DOC").trim().replace(/-+$/, "");
  const year = new Date().getFullYear();
  const seqStr = String(number).padStart(3, "0");
  return `${cleanPrefix}-${year}-${seqStr}`;
}

async function runTests() {
  console.log("=== STARTING SHASHIKALA POWER TECH E2E VERIFICATION ===");

  // 1. Verify CompanySettings and Initial Seed
  const settings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  });
  console.assert(settings !== null, "Settings must exist");
  console.assert(settings.displayName === "SHASHIKALAA POWER TECK", "Display name matches");
  console.assert(settings.gstNumber === "27AJRPN3091N1ZE", "GST matches");
  console.log("✔ Settings verified:", settings.displayName, "| GST:", settings.gstNumber);

  // 2. Verify Admin User Seed
  const admin = await prisma.user.findUnique({
    where: { username: "nitin" },
  });
  console.assert(admin !== null, "Admin 'nitin' must exist");
  const isMatch = await bcrypt.compare("admin123", admin.passwordHash);
  console.assert(isMatch === true, "Password matches temporary admin123");
  console.assert(admin.mustChangePassword === true, "mustChangePassword must be true initially");
  console.log("✔ Admin seed verified with mustChangePassword=true");

  // 3. Test Quotation 1 Creation (Sample 1: Rajesh Patil, 3.00 kW, ₹2,10,000)
  const snapshot1 = JSON.stringify({
    companyName: settings.companyName,
    displayName: settings.displayName,
    tagline: settings.tagline,
    gstNumber: settings.gstNumber,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    logoPath: settings.logoPath,
  });

  const q1 = await prisma.$transaction(async (tx) => {
    const s = await tx.companySettings.update({
      where: { id: "default" },
      data: { nextQuotationNumber: { increment: 1 } },
    });
    const num = formatDocNumber(s.quotationPrefix, s.nextQuotationNumber - 1);
    return tx.quotation.create({
      data: {
        quotationNumber: num,
        date: "20/09/2026",
        customerName: "Rajesh Patil",
        proposedSystem: "On-Grid Rooftop Solar",
        connectionType: "LT 1-Phase Grid Connected",
        systemCapacity: "3.00",
        estimatedGeneration: "12 - 16",
        validityDays: 15,
        totalAmount: 210000,
        gstInclusive: true,
        investmentNote: "Includes all materials, transport, installation & net-metering support.",
        companySnapshot: snapshot1,
        createdBy: "Nitin Nagpure",
        items: {
          create: [
            {
              sortOrder: 0,
              component: "Solar PV Modules",
              specification: "High-efficiency Mono PERC / Half-Cut Technology",
              brandModel: "VIKRAM / WAAREE",
              quantity: "3.0 kW Capacity",
            },
            {
              sortOrder: 1,
              component: "Grid-Tied Solar Inverter",
              specification: "High-efficiency string inverter with built-in protections",
              brandModel: "Polycab",
              quantity: "1 Unit (3 kW)",
            },
            {
              sortOrder: 2,
              component: "Module Mounting Structure (MMS)",
              specification: "High-grade Galvanized Iron (GI), wind resistant structure",
              brandModel: "Standard Industrial",
              quantity: "1 Complete Set",
            },
            {
              sortOrder: 3,
              component: "BOS & Electrical Protection",
              specification: "ACDB/DCDB boxes, DC/AC Copper & Aluminum Cables, Surge Protection",
              brandModel: "Polycab",
              quantity: "1 Complete Lot",
            },
            {
              sortOrder: 4,
              component: "Earthing & Lightning Protection",
              specification: "Chemical Earthing Rods, Copper Bonded Strips, LA Rod",
              brandModel: "Heavy Duty Kit",
              quantity: "3 Pits + LA",
            },
            {
              sortOrder: 5,
              component: "Turnkey Execution & Commissioning",
              specification: "Design, Installation, Testing, and Net-Metering assistance",
              brandModel: "—",
              quantity: "Included",
            },
          ],
        },
      },
      include: { items: true },
    });
  });

  console.assert(q1.quotationNumber === "QT-2026-001", `Expected QT-2026-001, got ${q1.quotationNumber}`);
  console.assert(q1.items.length === 6, "Expected 6 items");
  console.log("✔ Sample Quotation 1 created:", q1.quotationNumber, "for", q1.customerName, `(Items: ${q1.items.length})`);

  // 4. Test Duplication (Sample 1 duplicated to Sample 2)
  const q2 = await prisma.$transaction(async (tx) => {
    const s = await tx.companySettings.update({
      where: { id: "default" },
      data: { nextQuotationNumber: { increment: 1 } },
    });
    const num = formatDocNumber(s.quotationPrefix, s.nextQuotationNumber - 1);
    return tx.quotation.create({
      data: {
        quotationNumber: num,
        date: "20/09/2026",
        customerName: "ABC Industries",
        proposedSystem: "Commercial Rooftop Solar",
        connectionType: "LT 3-Phase Grid Connected",
        systemCapacity: "5.00",
        estimatedGeneration: "20 - 24",
        validityDays: 15,
        totalAmount: 310000,
        gstInclusive: true,
        investmentNote: q1.investmentNote,
        companySnapshot: snapshot1,
        createdBy: "Nitin Nagpure",
        items: {
          create: q1.items.map((it) => ({
            sortOrder: it.sortOrder,
            component: it.component,
            specification: it.specification,
            brandModel: it.brandModel,
            quantity: it.quantity,
          })),
        },
      },
      include: { items: true },
    });
  });

  console.assert(q2.quotationNumber === "QT-2026-002", `Expected QT-2026-002, got ${q2.quotationNumber}`);
  console.assert(q2.totalAmount === 310000, "Expected ₹3,10,000");
  console.log("✔ Sample Quotation 2 created:", q2.quotationNumber, "for", q2.customerName, "Total:", q2.totalAmount);

  // 5. Test Quotation -> Invoice Conversion
  const inv1 = await prisma.$transaction(async (tx) => {
    const s = await tx.companySettings.update({
      where: { id: "default" },
      data: { nextInvoiceNumber: { increment: 1 } },
    });
    const num = formatDocNumber(s.invoicePrefix, s.nextInvoiceNumber - 1);
    const subtotal = Math.round(q1.totalAmount / 1.18);
    const gstAmount = Math.round(q1.totalAmount - subtotal);

    return tx.invoice.create({
      data: {
        invoiceNumber: num,
        quotationId: q1.id,
        invoiceDate: "20/09/2026",
        dueDate: "30/09/2026",
        customerName: q1.customerName,
        customerAddress: "Nagpur, Maharashtra",
        customerMobile: "+91 9876543210",
        customerGst: "27XXXXX0000X1ZX",
        subtotal,
        gstAmount,
        discount: 0,
        totalAmount: q1.totalAmount,
        amountPaid: 0,
        paymentStatus: "UNPAID",
        paymentMethod: "Bank Transfer",
        notes: `Created from Quotation ${q1.quotationNumber}`,
        companySnapshot: snapshot1,
        createdBy: "Nitin Nagpure",
        items: {
          create: [
            {
              sortOrder: 0,
              description: `Solar PV System Installation (${q1.systemCapacity} kW ${q1.proposedSystem})`,
              quantity: 1,
              rate: subtotal,
              gstRate: 18,
              amount: q1.totalAmount,
            },
          ],
        },
      },
      include: { items: true },
    });
  });

  console.assert(inv1.invoiceNumber === "INV-2026-001", `Expected INV-2026-001, got ${inv1.invoiceNumber}`);
  console.assert(inv1.quotationId === q1.id, "quotationId linked");
  console.assert(inv1.totalAmount === 210000, "Invoice total matches quotation");
  console.log("✔ Quotation -> Invoice conversion verified:", inv1.invoiceNumber, "linked to", q1.quotationNumber);

  // 6. Test Company Snapshot Immutability
  // Update company phone in settings
  await prisma.companySettings.update({
    where: { id: "default" },
    data: { phone: "+91 99999 88888" },
  });

  // Verify historical quotation snapshot is untouched
  const fetchedQ1 = await prisma.quotation.findUnique({
    where: { id: q1.id },
  });
  const parsedSnapshot = JSON.parse(fetchedQ1.companySnapshot);
  console.assert(parsedSnapshot.phone === "+91 95271 61595", "Historical snapshot phone must not change");
  console.log("✔ Company Snapshot Immutability verified: Phone remains", parsedSnapshot.phone);

  // Revert phone back to original
  await prisma.companySettings.update({
    where: { id: "default" },
    data: { phone: "+91 95271 61595" },
  });

  console.log("=== ALL E2E VERIFICATION CHECKS PASSED SUCCESSFULLY ===");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
