import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export function formatDocNumber(prefix: string, number: number): string {
  const cleanPrefix = (prefix || "DOC").trim().replace(/-+$/, "");
  const year = new Date().getFullYear();
  const seqStr = String(number).padStart(3, "0");
  return `${cleanPrefix}-${year}-${seqStr}`;
}

export async function peekNextQuotationNumber(): Promise<string> {
  try {
    let settings = await prisma.companySettings.findUnique({
      where: { id: "default" },
    });
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: { id: "default" },
      });
    }
    return formatDocNumber(settings.quotationPrefix || "QT", settings.nextQuotationNumber);
  } catch (err) {
    console.error("peekNextQuotationNumber error:", err);
    return formatDocNumber("QT", 1);
  }
}

export async function peekNextInvoiceNumber(): Promise<string> {
  try {
    let settings = await prisma.companySettings.findUnique({
      where: { id: "default" },
    });
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: { id: "default" },
      });
    }
    return formatDocNumber(settings.invoicePrefix || "INV", settings.nextInvoiceNumber);
  } catch (err) {
    console.error("peekNextInvoiceNumber error:", err);
    return formatDocNumber("INV", 1);
  }
}

/**
 * Atomically increments and returns the next quotation number inside a transaction,
 * guaranteeing no collision with existing records.
 */
export async function allocateQuotationNumber(tx: any): Promise<string> {
  const settings = await tx.companySettings.upsert({
    where: { id: "default" },
    update: {
      nextQuotationNumber: { increment: 1 },
    },
    create: {
      id: "default",
      nextQuotationNumber: 2,
    },
  });

  let allocatedNumber = settings.nextQuotationNumber - 1;
  const prefix = settings.quotationPrefix || "QT";
  let candidate = formatDocNumber(prefix, allocatedNumber);

  // Check if candidate exists, advance if necessary
  let exists = await tx.quotation.findUnique({
    where: { quotationNumber: candidate },
    select: { id: true },
  });

  while (exists) {
    allocatedNumber += 1;
    candidate = formatDocNumber(prefix, allocatedNumber);
    exists = await tx.quotation.findUnique({
      where: { quotationNumber: candidate },
      select: { id: true },
    });
  }

  if (allocatedNumber >= settings.nextQuotationNumber) {
    await tx.companySettings.update({
      where: { id: "default" },
      data: { nextQuotationNumber: allocatedNumber + 1 },
    });
  }

  return candidate;
}

/**
 * Atomically increments and returns the next invoice number inside a transaction,
 * guaranteeing no collision with existing records.
 */
export async function allocateInvoiceNumber(tx: any): Promise<string> {
  const settings = await tx.companySettings.upsert({
    where: { id: "default" },
    update: {
      nextInvoiceNumber: { increment: 1 },
    },
    create: {
      id: "default",
      nextInvoiceNumber: 2,
    },
  });

  let allocatedNumber = settings.nextInvoiceNumber - 1;
  const prefix = settings.invoicePrefix || "INV";
  let candidate = formatDocNumber(prefix, allocatedNumber);

  // Check if candidate exists, advance if necessary
  let exists = await tx.invoice.findUnique({
    where: { invoiceNumber: candidate },
    select: { id: true },
  });

  while (exists) {
    allocatedNumber += 1;
    candidate = formatDocNumber(prefix, allocatedNumber);
    exists = await tx.invoice.findUnique({
      where: { invoiceNumber: candidate },
      select: { id: true },
    });
  }

  if (allocatedNumber >= settings.nextInvoiceNumber) {
    await tx.companySettings.update({
      where: { id: "default" },
      data: { nextInvoiceNumber: allocatedNumber + 1 },
    });
  }

  return candidate;
}
