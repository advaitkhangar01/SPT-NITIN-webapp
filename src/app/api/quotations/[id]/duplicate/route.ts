import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { allocateQuotationNumber } from "@/lib/numbering";
import { getCompanySettingsSnapshot, parseCompanySnapshot } from "@/lib/company";
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

    const source = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source quotation not found" }, { status: 404 });
    }

    const currentSettings = await getCompanySettingsSnapshot();
    const sourceSnapshot = parseCompanySnapshot(source.companySnapshot, currentSettings);
    const companySnapshot = {
      ...currentSettings,
      showBankDetails: sourceSnapshot.showBankDetails !== false,
      showDocumentsRequired: sourceSnapshot.showDocumentsRequired !== false,
      bankName: sourceSnapshot.bankName || currentSettings.bankName,
      accountNumber: sourceSnapshot.accountNumber || currentSettings.accountNumber,
      ifscCode: sourceSnapshot.ifscCode || currentSettings.ifscCode,
      branch: sourceSnapshot.branch || currentSettings.branch,
      accountName: sourceSnapshot.accountName || currentSettings.accountName,
    };
    const snapshotStr = JSON.stringify(companySnapshot);

    const duplicated = await prisma.$transaction(async (tx) => {
      const quotationNumber = await allocateQuotationNumber(tx);

      const created = await tx.quotation.create({
        data: {
          quotationNumber,
          date: formatDateDMY(new Date()),
          customerName: source.customerName,
          proposedSystem: source.proposedSystem,
          connectionType: source.connectionType,
          systemCapacity: source.systemCapacity,
          estimatedGeneration: source.estimatedGeneration,
          validityDays: source.validityDays,
          totalAmount: source.totalAmount,
          gstInclusive: source.gstInclusive,
          investmentNote: source.investmentNote,
          companySnapshot: snapshotStr,
          createdBy: session.name || session.username,
          items: {
            create: source.items.map((item, idx) => ({
              sortOrder: idx,
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

      return created;
    });

    return NextResponse.json({ success: true, quotation: duplicated });
  } catch (err: any) {
    console.error("Duplicate quotation error:", err);
    return NextResponse.json({ error: "Failed to duplicate quotation" }, { status: 500 });
  }
}
