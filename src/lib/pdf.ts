import puppeteer from "puppeteer";

export async function generatePdfFromUrl(url: string, sessionCookie?: string): Promise<Buffer> {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    if (sessionCookie) {
      const urlObj = new URL(url);
      await page.setCookie({
        name: "spt_session",
        value: sessionCookie,
        domain: urlObj.hostname,
        path: "/",
      });
    }

    // Emulate screen/print media
    await page.emulateMediaType("print");
    await page.goto(url, {
      waitUntil: ["load", "networkidle0"],
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: true,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
