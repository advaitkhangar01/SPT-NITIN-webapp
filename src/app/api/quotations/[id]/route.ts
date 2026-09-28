import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateQuotationPayload } from "@/lib/validations";

export async function GET(
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

    return NextResponse.json({ quotation });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch quotation" }, { status: 500 });
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

    const existing = await prisma.quotation.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    if (
      session.role !== "ADMIN" &&
      existing.createdBy !== session.name &&
      existing.createdBy !== session.username
    ) {
      return NextResponse.json(
        { error: "Forbidden: You can only update quotations created by you" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = validateQuotationPayload(body);
    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: validation.error || "Invalid quotation data" },
        { status: 400 }
      );
    }

    const validData = validation.data;

    const updated = await prisma.$transaction(async (tx) => {
      // Delete old items and re-create
      await tx.quotationItem.deleteMany({
        where: { quotationId: params.id },
      });

      const q = await tx.quotation.update({
        where: { id: params.id },
        data: {
          date: validData.date,
          customerName: validData.customerName,
          proposedSystem: validData.proposedSystem,
          connectionType: validData.connectionType,
          systemCapacity: validData.systemCapacity,
          estimatedGeneration: validData.estimatedGeneration,
          validityDays: validData.validityDays,
          totalAmount: validData.totalAmount,
          gstInclusive: validData.gstInclusive,
          investmentNote: validData.investmentNote,
          items: {
            create: validData.items.map((item) => ({
              sortOrder: item.sortOrder,
              component: item.component,
              specification: item.specification,
              brandModel: item.brandModel,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });
      return q;
    });

    return NextResponse.json({ success: true, quotation: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
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

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    // Only Admin or creator can delete
    if (
      session.role !== "ADMIN" &&
      quotation.createdBy !== session.name &&
      quotation.createdBy !== session.username
    ) {
      return NextResponse.json(
        { error: "Forbidden: Only admins or the creator can delete this quotation" },
        { status: 403 }
      );
    }

    await prisma.quotation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete quotation" }, { status: 500 });
  }
}
