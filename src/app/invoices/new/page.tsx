import React from "react";
import InvoiceEditor from "@/components/InvoiceEditor";
import { getCompanySettingsSnapshot } from "@/lib/company";
import { peekNextInvoiceNumber } from "@/lib/numbering";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const [company, previewInvoiceNumber] = await Promise.all([
    getCompanySettingsSnapshot(),
    peekNextInvoiceNumber(),
  ]);

  return (
    <InvoiceEditor
      company={company}
      previewInvoiceNumber={previewInvoiceNumber}
    />
  );
}
