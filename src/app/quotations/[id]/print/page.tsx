import React from "react";
import { notFound } from "next/navigation";
import QuotationPreview from "@/components/QuotationPreview";
import { prisma } from "@/lib/prisma";
import { parseCompanySnapshot, getCompanySettingsSnapshot } from "@/lib/company";

export const dynamic = "force-dynamic";

export default async function QuotationPrintPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { autoPrint?: string };
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

  const fallbackCompany = await getCompanySettingsSnapshot();
  const company = parseCompanySnapshot(quotation.companySnapshot, fallbackCompany);

  return (
    <div className="bg-white min-h-screen flex flex-col items-center p-0 m-0 print:p-0">
      <QuotationPreview
        data={{
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
        scale={1}
      />

      {searchParams?.autoPrint === "true" && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 300);
              };
            `,
          }}
        />
      )}
    </div>
  );
}
