import React from "react";
import { notFound } from "next/navigation";
import QuotationPreview from "@/components/QuotationPreview";
import AutoPrintTrigger from "@/components/AutoPrintTrigger";
import PrintToolbar from "@/components/PrintToolbar";
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
    <div className="bg-slate-100 min-h-screen flex flex-col items-center p-0 m-0 print:p-0 print:bg-white">
      <PrintToolbar
        documentTitle={`Quotation #${quotation.quotationNumber} — ${quotation.customerName || "Customer"}`}
        backHref={`/quotations/${quotation.id}`}
        pdfDownloadHref={`/api/quotations/${quotation.id}/pdf`}
      />

      <div className="py-0 sm:py-6 print:py-0 w-full flex justify-center">
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
          showDocumentsRequired: company.showDocumentsRequired ?? true,
          showBankDetails: company.showBankDetails ?? true,
          bankName: company.bankName,
          accountNumber: company.accountNumber,
          ifscCode: company.ifscCode,
          branch: company.branch,
          accountName: company.accountName,
        }}
        company={company}
        scale={1}
      />
      </div>

      {searchParams?.autoPrint === "true" && <AutoPrintTrigger />}
    </div>
  );
}
