import React from "react";
import { notFound } from "next/navigation";
import InvoiceEditor from "@/components/InvoiceEditor";
import { prisma } from "@/lib/prisma";
import { parseCompanySnapshot, getCompanySettingsSnapshot } from "@/lib/company";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
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
    <InvoiceEditor
      initialData={{
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        quotationId: invoice.quotationId,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        customerName: invoice.customerName,
        customerAddress: invoice.customerAddress || "",
        customerMobile: invoice.customerMobile || "",
        customerGst: invoice.customerGst || "",
        subtotal: invoice.subtotal,
        gstAmount: invoice.gstAmount,
        discount: invoice.discount,
        totalAmount: invoice.totalAmount,
        amountPaid: invoice.amountPaid,
        paymentStatus: invoice.paymentStatus,
        paymentMethod: invoice.paymentMethod || "Bank Transfer",
        notes: invoice.notes || "",
        items: invoice.items.map((it) => ({
          id: it.id,
          description: it.description,
          quantity: it.quantity,
          rate: it.rate,
          gstRate: it.gstRate,
          amount: it.amount,
        })),
      }}
      company={company}
      previewInvoiceNumber={invoice.invoiceNumber}
    />
  );
}
