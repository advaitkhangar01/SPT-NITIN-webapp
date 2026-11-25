import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { allocateInvoiceNumber } from "@/lib/numbering";
import { getCompanySettingsSnapshot } from "@/lib/company";
import { formatDateDMY } from "@/lib/formatters";
import { calculateInvoiceGst, calculateBaseRateFromGross } from "@/lib/gst";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const companySnapshot = await getCompanySettingsSnapshot();
    const snapshotStr = JSON.stringify(companySnapshot);

    const today = formatDateDMY(new Date());
    const dueDate = formatDateDMY(
      new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    );

    // Calculate base rate from gross quotation total via authoritative engine
    const total = quotation.totalAmount || 0;
    const gstRate = 18;
    const subtotal = calculateBaseRateFromGross(total, gstRate, 1);

    // Build invoice items from quotation
    const invoiceItems = [
      {
        description: `Solar PV System Installation (${quotation.systemCapacity || "3.00"} kW ${quotation.proposedSystem || "Rooftop Solar"})`,
        hsn: "8541",
        quantity: 1,
        rate: subtotal,
        gstRate: gstRate,
        amount: subtotal,
      },
    ];

    const gstCalc = calculateInvoiceGst(invoiceItems);

    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await allocateInvoiceNumber(tx);

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          quotationId: quotation.id,
          invoiceDate: today,
          dueDate,
          customerName: quotation.customerName,
          customerAddress: "",
          customerMobile: "",
          customerGst: "",
          subtotal: gstCalc.subtotal,
          gstAmount: gstCalc.totalGst,
          discount: 0,
          totalAmount: total || gstCalc.roundedTotalAmount,
          amountPaid: 0,
          paymentStatus: "UNPAID",
          paymentMethod: "Bank Transfer",
          notes: `Created from Quotation ${quotation.quotationNumber}`,
          companySnapshot: snapshotStr,
          createdBy: session.name || session.username,
          items: {
            create: invoiceItems.map((it, idx) => ({
              sortOrder: idx,
              description: it.description,
              hsn: it.hsn || null,
              quantity: it.quantity,
              rate: it.rate,
              gstRate: it.gstRate,
              amount: it.amount,
            })),
          },
        },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      return created;
    });

    return NextResponse.json({ success: true, invoice });
  } catch (err: any) {
    console.error("Create invoice from quotation error:", err);
    return NextResponse.json(
      { error: "Failed to create invoice from quotation" },
      { status: 500 }
    );
  }
}
