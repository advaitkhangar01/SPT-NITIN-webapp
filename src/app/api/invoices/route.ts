import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { allocateInvoiceNumber } from "@/lib/numbering";
import { getCompanySettingsSnapshot } from "@/lib/company";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const whereClause: any = {};
    if (query) {
      whereClause.OR = [
        { invoiceNumber: { contains: query } },
        { customerName: { contains: query } },
      ];
    }
    if (status && status !== "ALL") {
      whereClause.paymentStatus = status;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices });
  } catch (err: any) {
    console.error("Fetch invoices error:", err);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      quotationId,
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
      accountName,
      bankName,
      accountNumber,
      ifscCode,
      branch,
      upiId,
    } = body;

    if (!customerName || !invoiceDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required invoice fields" },
        { status: 400 }
      );
    }

    const baseSnapshot = await getCompanySettingsSnapshot();
    const companySnapshot = {
      ...baseSnapshot,
      accountName: accountName?.trim() || baseSnapshot.accountName,
      bankName: bankName?.trim() || baseSnapshot.bankName,
      accountNumber: accountNumber?.trim() || baseSnapshot.accountNumber,
      ifscCode: ifscCode?.trim() || baseSnapshot.ifscCode,
      branch: branch?.trim() || baseSnapshot.branch,
      upiId: upiId !== undefined ? upiId.trim() : (baseSnapshot.upiId || ""),
    };
    const snapshotStr = JSON.stringify(companySnapshot);

    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await allocateInvoiceNumber(tx);

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          quotationId: quotationId || null,
          invoiceDate,
          dueDate: dueDate || invoiceDate,
          customerName,
          customerAddress: customerAddress || "",
          customerMobile: customerMobile || "",
          customerGst: customerGst || "",
          subtotal: Number(subtotal) || 0,
          gstAmount: Number(gstAmount) || 0,
          discount: Number(discount) || 0,
          totalAmount: Number(totalAmount) || 0,
          amountPaid: Number(amountPaid) || 0,
          paymentStatus: paymentStatus || "UNPAID",
          paymentMethod: paymentMethod || "Bank Transfer",
          notes: notes || "",
          companySnapshot: snapshotStr,
          createdBy: session.name || session.username,
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

      return created;
    });

    return NextResponse.json({ success: true, invoice });
  } catch (err: any) {
    console.error("Create invoice error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}
