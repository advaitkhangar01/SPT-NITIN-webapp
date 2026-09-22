import React from "react";
import { notFound } from "next/navigation";
import InvoicePreview from "@/components/InvoicePreview";
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
    <div className="bg-white min-h-screen flex flex-col items-center p-0 m-0 print:p-0">
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
