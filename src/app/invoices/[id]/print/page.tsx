import React from "react";
import { notFound } from "next/navigation";
import InvoicePreview from "@/components/InvoicePreview";
import AutoPrintTrigger from "@/components/AutoPrintTrigger";
import PrintToolbar from "@/components/PrintToolbar";
import { prisma } from "@/lib/prisma";
import { parseCompanySnapshot, getCompanySettingsSnapshot } from "@/lib/company";

export const dynamic = "force-dynamic";

export default async function InvoicePrintPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { autoPrint?: string };
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const fallbackCompany = await getCompanySettingsSnapshot();
  const company = parseCompanySnapshot(invoice.companySnapshot, fallbackCompany);

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col items-center p-0 m-0 print:p-0 print:bg-white">
      <PrintToolbar
        documentTitle={`Invoice #${invoice.invoiceNumber} — ${invoice.customerName || "Customer"}`}
        backHref={`/invoices/${invoice.id}`}
        pdfDownloadHref={`/api/invoices/${invoice.id}/pdf`}
      />

      <div className="py-0 sm:py-6 print:py-0 w-full flex justify-center">
        <InvoicePreview
          data={{
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            customerName: invoice.customerName,
            customerAddress: invoice.customerAddress || undefined,
            customerMobile: invoice.customerMobile || undefined,
            customerGst: invoice.customerGst || undefined,
            items: invoice.items.map((it) => ({
              id: it.id,
              description: it.description,
              hsn: it.hsn || undefined,
              quantity: it.quantity,
              rate: it.rate,
              gstRate: it.gstRate,
              amount: it.amount,
              per: "Set",
            })),
            subtotal: invoice.subtotal,
            gstAmount: invoice.gstAmount,
            discount: invoice.discount,
            totalAmount: invoice.totalAmount,
            amountPaid: invoice.amountPaid,
            paymentStatus: invoice.paymentStatus,
            paymentMethod: invoice.paymentMethod || undefined,
            notes: invoice.notes || undefined,
            refNo: invoice.quotationId ? `QT-${invoice.quotationId.slice(-4)}` : undefined,
          }}
          company={company}
          scale={1}
        />
      </div>

      {searchParams?.autoPrint === "true" && <AutoPrintTrigger />}
    </div>
  );
}
