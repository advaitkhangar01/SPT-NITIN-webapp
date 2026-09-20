import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export function formatDocNumber(prefix: string, number: number): string {
  const cleanPrefix = (prefix || "DOC").trim().replace(/-+$/, "");
  const year = new Date().getFullYear();
  const seqStr = String(number).padStart(3, "0");
  return `${cleanPrefix}-${year}-${seqStr}`;
}

export async function peekNextQuotationNumber(): Promise<string> {
  let settings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) {
    settings = await prisma.companySettings.create({
      data: { id: "default" },
    });
  }
  return formatDocNumber(settings.quotationPrefix || "QT", settings.nextQuotationNumber);
}

export async function peekNextInvoiceNumber(): Promise<string> {
  let settings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  });
  if (!settings) {
    settings = await prisma.companySettings.create({
      data: { id: "default" },
    });
  }
  return formatDocNumber(settings.invoicePrefix || "INV", settings.nextInvoiceNumber);
}

/**
 * Atomically increments and returns the next quotation number inside a transaction.
 */
export async function allocateQuotationNumber(tx: any): Promise<string> {
  const settings = await tx.companySettings.update({
    where: { id: "default" },
    data: {
      nextQuotationNumber: { increment: 1 },
    },
  });
  const allocatedNumber = settings.nextQuotationNumber - 1;
  return formatDocNumber(settings.quotationPrefix || "QT", allocatedNumber);
}

/**
 * Atomically increments and returns the next invoice number inside a transaction.
 */
export async function allocateInvoiceNumber(tx: any): Promise<string> {
  const settings = await tx.companySettings.update({
    where: { id: "default" },
    data: {
      nextInvoiceNumber: { increment: 1 },
    },
  });
  const allocatedNumber = settings.nextInvoiceNumber - 1;
  return formatDocNumber(settings.invoicePrefix || "INV", allocatedNumber);
}
