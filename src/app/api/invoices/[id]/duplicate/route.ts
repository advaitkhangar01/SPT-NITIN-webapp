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

    const source = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source invoice not found" }, { status: 404 });
    }

    const companySnapshot = await getCompanySettingsSnapshot();
    const snapshotStr = JSON.stringify(companySnapshot);

    const duplicated = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await allocateInvoiceNumber(tx);

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          quotationId: source.quotationId,
          invoiceDate: formatDateDMY(new Date()),
          dueDate: source.dueDate,
          customerName: source.customerName,
          customerAddress: source.customerAddress,
          customerMobile: source.customerMobile,
          customerGst: source.customerGst,
          subtotal: source.subtotal,
          gstAmount: source.gstAmount,
          discount: source.discount,
          totalAmount: source.totalAmount,
          amountPaid: 0,
          paymentStatus: "UNPAID",
          paymentMethod: source.paymentMethod,
          notes: source.notes,
          companySnapshot: snapshotStr,
          createdBy: session.name || session.username,
          items: {
            create: source.items.map((item, idx) => ({
              sortOrder: idx,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              gstRate: item.gstRate,
              amount: item.amount,
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

    return NextResponse.json({ success: true, invoice: duplicated });
  } catch (err: any) {
    console.error("Duplicate invoice error:", err);
    return NextResponse.json({ error: "Failed to duplicate invoice" }, { status: 500 });
  }
}
