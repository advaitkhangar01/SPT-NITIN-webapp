import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { allocateInvoiceNumber } from "@/lib/numbering";
import { getCompanySettingsSnapshot } from "@/lib/company";
import { validateInvoicePayload } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const limitParam = parseInt(searchParams.get("limit") || "100", 10);
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const take = Math.min(Math.max(1, isNaN(limitParam) ? 100 : limitParam), 200);
    const skip = Math.max(0, (isNaN(pageParam) ? 1 : pageParam) - 1) * take;

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
      take,
      skip,
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
    const validation = validateInvoicePayload(body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "Invalid invoice data" },
        { status: 400 }
      );
    }

    const validData = validation.data;

    if (validData.invoiceNumber) {
      const existingInv = await prisma.invoice.findUnique({
        where: { invoiceNumber: validData.invoiceNumber },
      });
      if (existingInv) {
        return NextResponse.json(
          { error: `Invoice number "${validData.invoiceNumber}" is already in use by another invoice` },
          { status: 409 }
        );
      }
    }

    const baseSnapshot = await getCompanySettingsSnapshot();
    const companySnapshot = {
      ...baseSnapshot,
      accountName: validData.accountName || baseSnapshot.accountName,
      bankName: validData.bankName || baseSnapshot.bankName,
      accountNumber: validData.accountNumber || baseSnapshot.accountNumber,
      ifscCode: validData.ifscCode || baseSnapshot.ifscCode,
      branch: validData.branch || baseSnapshot.branch,
      upiId: validData.upiId !== undefined ? validData.upiId : (baseSnapshot.upiId || ""),
    };
    const snapshotStr = JSON.stringify(companySnapshot);

    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = validData.invoiceNumber || (await allocateInvoiceNumber(tx));

      const created = await tx.invoice.create({
        data: {
          invoiceNumber,
          quotationId: validData.quotationId || null,
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
          companySnapshot: snapshotStr,
          createdBy: session.name || session.username,
          items: {
            create: validData.items.map((item) => ({
              sortOrder: item.sortOrder,
              description: item.description,
              hsn: item.hsn || null,
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

    return NextResponse.json({ success: true, invoice });
  } catch (err: any) {
    console.error("Create invoice error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}
