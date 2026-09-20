import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { allocateInvoiceNumber } from "@/lib/numbering";
import { getCompanySettingsSnapshot } from "@/lib/company";
import { formatDateDMY } from "@/lib/formatters";

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

    // Calculate subtotal & GST from quotation total
    // E.g. total 2,10,000 at 18% GST -> Subtotal: 1,77,966, GST: 32,034
    const total = quotation.totalAmount || 0;
    const gstRate = 18;
    const subtotal = Math.round(total / (1 + gstRate / 100));
    const gstAmount = Math.round(total - subtotal);

    // Build invoice items from quotation
    // Either a comprehensive summary item or one per component
    const invoiceItems = [
      {
        description: `Solar PV System Installation (${quotation.systemCapacity || "3.00"} kW ${quotation.proposedSystem || "Rooftop Solar"})`,
        quantity: 1,
        rate: subtotal,
        gstRate: gstRate,
        amount: total,
      },
    ];

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
          subtotal,
          gstAmount,
          discount: 0,
          totalAmount: total,
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
