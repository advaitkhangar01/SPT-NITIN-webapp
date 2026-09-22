import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generatePdfFromUrl } from "@/lib/pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const sessionToken = req.cookies.get("spt_session")?.value;
    const internalPort = process.env.PORT || "3000";
    const printUrl = `http://127.0.0.1:${internalPort}/invoices/${params.id}/print`;

    try {
      const pdfBuffer = await generatePdfFromUrl(printUrl, sessionToken);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (pdfErr) {
      console.warn("Puppeteer generation fallback to print page:", pdfErr);
      return NextResponse.redirect(
        new URL(`/invoices/${params.id}/print?autoPrint=true`, req.url)
      );
    }
  } catch (err: any) {
    console.error("Invoice PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
