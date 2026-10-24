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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!params.id || typeof params.id !== "string" || !/^[a-zA-Z0-9_-]+$/.test(params.id)) {
      return NextResponse.json({ error: "Invalid quotation ID format" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const sessionToken = req.cookies.get("spt_session")?.value;
    const internalPort = process.env.PORT || (req.nextUrl.port && req.nextUrl.port !== "80" && req.nextUrl.port !== "443" ? req.nextUrl.port : "3000");
    const baseUrl = process.env.INTERNAL_BASE_URL || `http://127.0.0.1:${internalPort}`;
    const printUrl = `${baseUrl}/quotations/${params.id}/print`;

    const isPreview = req.nextUrl.searchParams.get("preview") === "true";
    const disposition = isPreview ? "inline" : "attachment";

    try {
      const pdfBuffer = await generatePdfFromUrl(printUrl, sessionToken);

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${disposition}; filename="Quotation-${quotation.quotationNumber}.pdf"`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    } catch (pdfErr) {
      console.warn("Puppeteer generation fallback to print page:", pdfErr);
      const forwardedHost = req.headers.get("x-forwarded-host");
      const host = forwardedHost || req.headers.get("host") || req.nextUrl.host;
      const proto = req.headers.get("x-forwarded-proto") || (forwardedHost ? "https" : req.nextUrl.protocol.replace(":", ""));
      const publicBaseUrl = host ? `${proto}://${host}` : req.nextUrl.origin;
      return NextResponse.redirect(
        new URL(`/quotations/${params.id}/print?autoPrint=true`, publicBaseUrl)
      );
    }
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
