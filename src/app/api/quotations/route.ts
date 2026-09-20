import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { allocateQuotationNumber } from "@/lib/numbering";
import { getCompanySettingsSnapshot } from "@/lib/company";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    const whereClause: any = {};
    if (query) {
      whereClause.OR = [
        { quotationNumber: { contains: query } },
        { customerName: { contains: query } },
      ];
    }

    const quotations = await prisma.quotation.findMany({
      where: whereClause,
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quotations });
  } catch (err: any) {
    console.error("Fetch quotations error:", err);
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 });
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

    if (!customerName || !date || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required quotation fields" },
        { status: 400 }
      );
    }

    // Capture frozen snapshot of current company settings
    const companySnapshot = await getCompanySettingsSnapshot();
    const snapshotStr = JSON.stringify(companySnapshot);

    // Use Prisma transaction to atomically allocate number and save quotation
    const quotation = await prisma.$transaction(async (tx) => {
      const quotationNumber = await allocateQuotationNumber(tx);

      const created = await tx.quotation.create({
        data: {
          quotationNumber,
          date,
          customerName,
          proposedSystem: proposedSystem || "On-Grid Rooftop Solar",
          connectionType: connectionType || "LT 1-Phase Grid Connected",
          systemCapacity: String(systemCapacity),
          estimatedGeneration: String(estimatedGeneration),
          validityDays: Number(validityDays) || 15,
          totalAmount: Number(totalAmount) || 0,
          gstInclusive: gstInclusive ?? true,
          investmentNote:
            investmentNote ||
            "Includes all materials, transport, installation & net-metering support.",
          companySnapshot: snapshotStr,
          createdBy: session.name || session.username,
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

      return created;
    });

    return NextResponse.json({ success: true, quotation });
  } catch (err: any) {
    console.error("Create quotation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create quotation" },
      { status: 500 }
    );
  }
}
