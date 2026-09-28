import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateInvoicePayload } from "@/lib/validations";

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

    const existing = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (
      session.role !== "ADMIN" &&
      existing.createdBy !== session.name &&
      existing.createdBy !== session.username
    ) {
      return NextResponse.json(
        { error: "Forbidden: You can only update invoices created by you" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = validateInvoicePayload(body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "Invalid invoice data" },
        { status: 400 }
      );
    }

    const validData = validation.data;

    let existingSnapshot: any = {};
    try {
      existingSnapshot = JSON.parse(existing.companySnapshot || "{}");
    } catch {}

    const updatedSnapshot = {
      ...existingSnapshot,
      accountName: validData.accountName || existingSnapshot.accountName || "SHASHIKALA POWER TECH",
      bankName: validData.bankName || existingSnapshot.bankName || "Maharashtra State Co-operative Bank",
      accountNumber: validData.accountNumber || existingSnapshot.accountNumber || "0058107040000460",
      ifscCode: validData.ifscCode || existingSnapshot.ifscCode || "MSCI0082056",
      branch: validData.branch || existingSnapshot.branch || "Nagpur Branch",
      upiId: validData.upiId !== undefined ? validData.upiId : (existingSnapshot.upiId || ""),
    };

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      });

      const inv = await tx.invoice.update({
        where: { id: params.id },
        data: {
          invoiceDate: validData.invoiceDate,
          dueDate: validData.dueDate,
          customerName: validData.customerName,
          customerAddress: validData.customerAddress,
          customerMobile: validData.customerMobile,
          customerGst: validData.customerGst,
          subtotal: validData.subtotal,
          gstAmount: validData.gstAmount,
          discount: validData.discount,
          totalAmount: validData.totalAmount,
          amountPaid: validData.amountPaid,
          paymentStatus: validData.paymentStatus,
          paymentMethod: validData.paymentMethod,
          notes: validData.notes,
          companySnapshot: JSON.stringify(updatedSnapshot),
          items: {
            create: validData.items.map((item) => ({
              sortOrder: item.sortOrder,
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

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (
      session.role !== "ADMIN" &&
      invoice.createdBy !== session.name &&
      invoice.createdBy !== session.username
    ) {
      return NextResponse.json(
        { error: "Forbidden: Only admins or the creator can delete this invoice" },
        { status: 403 }
      );
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
