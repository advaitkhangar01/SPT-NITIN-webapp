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

    const body = await req.json();
    const {
      date,
      customerName,
      proposedSystem,
      connectionType,
      systemCapacity,
      estimatedGeneration,
      validityDays,
      totalAmount,
      gstInclusive,
      investmentNote,
      items,
    } = body;

    const existing = await prisma.quotation.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Delete old items and re-create
      await tx.quotationItem.deleteMany({
        where: { quotationId: params.id },
      });

      const q = await tx.quotation.update({
        where: { id: params.id },
        data: {
          date,
          customerName,
          proposedSystem,
          connectionType,
          systemCapacity: String(systemCapacity),
          estimatedGeneration: String(estimatedGeneration),
          validityDays: Number(validityDays),
          totalAmount: Number(totalAmount),
          gstInclusive: gstInclusive ?? true,
          investmentNote,
          items: {
            create: items.map((item: any, idx: number) => ({
              sortOrder: idx,
              component: item.component,
              specification: item.specification || "",
              brandModel: item.brandModel || "",
              quantity: item.quantity || "",
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

    // Only Admin or creator can delete
    if (session.role !== "ADMIN") {
      const quotation = await prisma.quotation.findUnique({
        where: { id: params.id },
      });
      if (quotation && quotation.createdBy !== session.name && quotation.createdBy !== session.username) {
        return NextResponse.json(
          { error: "Only admins can delete this quotation" },
          { status: 403 }
        );
      }
    }

    await prisma.quotation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete quotation" }, { status: 500 });
  }
}
