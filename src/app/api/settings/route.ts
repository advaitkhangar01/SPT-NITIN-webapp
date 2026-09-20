import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.companySettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can modify company settings" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      companyName,
      displayName,
      tagline,
      gstNumber,
      phone,
      email,
      address,
      logoPath,
      quotationPrefix,
      invoicePrefix,
      nextQuotationNumber,
      nextInvoiceNumber,
      defaultValidityDays,
      defaultGst,
    } = body;

    const updated = await prisma.companySettings.upsert({
      where: { id: "default" },
      update: {
        companyName,
        displayName,
        tagline,
        gstNumber,
        phone,
        email,
        address,
        logoPath,
        quotationPrefix,
        invoicePrefix,
        nextQuotationNumber: Number(nextQuotationNumber) || 1,
        nextInvoiceNumber: Number(nextInvoiceNumber) || 1,
        defaultValidityDays: Number(defaultValidityDays) || 15,
        defaultGst: Number(defaultGst) || 18.0,
      },
      create: {
        id: "default",
        companyName,
        displayName,
        tagline,
        gstNumber,
        phone,
        email,
        address,
        logoPath: logoPath || "/logo.png",
        quotationPrefix: quotationPrefix || "QT-",
        invoicePrefix: invoicePrefix || "INV-",
        nextQuotationNumber: Number(nextQuotationNumber) || 1,
        nextInvoiceNumber: Number(nextInvoiceNumber) || 1,
        defaultValidityDays: Number(defaultValidityDays) || 15,
        defaultGst: Number(defaultGst) || 18.0,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    console.error("Update settings error:", err);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
