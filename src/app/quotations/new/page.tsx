import React from "react";
import QuotationEditor from "@/components/QuotationEditor";
import { getCompanySettingsSnapshot } from "@/lib/company";
import { peekNextQuotationNumber } from "@/lib/numbering";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage() {
  const company = await getCompanySettingsSnapshot();
  const previewQuotationNumber = await peekNextQuotationNumber();

  return (
    <QuotationEditor
      company={company}
      previewQuotationNumber={previewQuotationNumber}
    />
  );
}
