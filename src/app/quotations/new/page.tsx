import React from "react";
import QuotationEditor from "@/components/QuotationEditor";
import { getCompanySettingsSnapshot } from "@/lib/company";
import { peekNextQuotationNumber } from "@/lib/numbering";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage() {
  // Both functions query companySettings; they share the same DB row.
  // For a small single-user tool on SQLite this is negligible but kept explicit for clarity.
  const [company, previewQuotationNumber] = await Promise.all([
    getCompanySettingsSnapshot(),
    peekNextQuotationNumber(),
  ]);

  return (
    <QuotationEditor
      company={company}
      previewQuotationNumber={previewQuotationNumber}
    />
  );
}
