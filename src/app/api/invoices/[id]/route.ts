import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      invoiceDate,
      dueDate,
      customerName,
      customerAddress,
      customerMobile,
      customerGst,
      items,
      subtotal,
      gstAmount,
      discount,
      totalAmount,
      amountPaid,
      paymentStatus,
      paymentMethod,
      notes,
    } = body;

    const existing = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      });

      const inv = await tx.invoice.update({
        where: { id: params.id },
        data: {
          invoiceDate,
          dueDate,
          customerName,
          customerAddress,
          customerMobile,
          customerGst,
          subtotal: Number(subtotal) || 0,
          gstAmount: Number(gstAmount) || 0,
          discount: Number(discount) || 0,
          totalAmount: Number(totalAmount) || 0,
          amountPaid: Number(amountPaid) || 0,
          paymentStatus: paymentStatus || "UNPAID",
          paymentMethod: paymentMethod || "Bank Transfer",
          notes,
          items: {
            create: items.map((item: any, idx: number) => ({
              sortOrder: idx,
              description: item.description,
              quantity: Number(item.quantity) || 1,
              rate: Number(item.rate) || 0,
              gstRate: Number(item.gstRate) || 18,
              amount: Number(item.amount) || 0,
            })),
          },
        },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      return inv;
    });

    return NextResponse.json({ success: true, invoice: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      const invoice = await prisma.invoice.findUnique({
        where: { id: params.id },
      });
      if (invoice && invoice.createdBy !== session.name && invoice.createdBy !== session.username) {
        return NextResponse.json(
          { error: "Only admins can delete this invoice" },
          { status: 403 }
        );
      }
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
