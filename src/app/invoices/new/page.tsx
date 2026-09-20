import React from "react";
import InvoiceEditor from "@/components/InvoiceEditor";
import { getCompanySettingsSnapshot } from "@/lib/company";
import { peekNextInvoiceNumber } from "@/lib/numbering";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const company = await getCompanySettingsSnapshot();
  const previewInvoiceNumber = await peekNextInvoiceNumber();

  return (
    <InvoiceEditor
      company={company}
      previewInvoiceNumber={previewInvoiceNumber}
    />
  );
}
