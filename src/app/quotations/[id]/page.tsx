import React from "react";
import { notFound } from "next/navigation";
import QuotationEditor from "@/components/QuotationEditor";
import { prisma } from "@/lib/prisma";
import { parseCompanySnapshot, getCompanySettingsSnapshot } from "@/lib/company";

export const dynamic = "force-dynamic";

export default async function QuotationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: params.id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!quotation) {
    notFound();
  }

  // Use the immutable frozen company snapshot saved with this quotation
  const fallbackCompany = await getCompanySettingsSnapshot();
  const company = parseCompanySnapshot(quotation.companySnapshot, fallbackCompany);

  return (
    <QuotationEditor
      initialData={{
        id: quotation.id,
        quotationNumber: quotation.quotationNumber,
        date: quotation.date,
        customerName: quotation.customerName,
        proposedSystem: quotation.proposedSystem,
        connectionType: quotation.connectionType,
        systemCapacity: quotation.systemCapacity,
        estimatedGeneration: quotation.estimatedGeneration,
        validityDays: quotation.validityDays,
        items: quotation.items.map((it) => ({
          id: it.id,
          component: it.component,
          specification: it.specification,
          brandModel: it.brandModel,
          quantity: it.quantity,
        })),
        totalAmount: quotation.totalAmount,
        gstInclusive: quotation.gstInclusive,
        investmentNote: quotation.investmentNote,
      }}
      company={company}
      previewQuotationNumber={quotation.quotationNumber}
    />
  );
}
