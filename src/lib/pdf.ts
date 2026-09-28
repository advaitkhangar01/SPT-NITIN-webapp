import puppeteer, { Browser } from "puppeteer";

let activePdfJobs = 0;
const MAX_CONCURRENT_PDF_JOBS = 2;

export async function generatePdfFromUrl(url: string, sessionCookie?: string): Promise<Buffer> {
  const urlObj = new URL(url);
  // SSRF Protection: strictly allow only loopback addresses
  if (urlObj.hostname !== "127.0.0.1" && urlObj.hostname !== "localhost") {
    throw new Error("Security Error: Target host is restricted to local server.");
  }

  // Concurrency limit to prevent memory exhaustion on the host VPS
  if (activePdfJobs >= MAX_CONCURRENT_PDF_JOBS) {
    throw new Error("Server is currently busy generating other PDF documents. Please retry in a few seconds.");
  }

  activePdfJobs++;
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });

    const page = await browser.newPage();

    try {
      if (sessionCookie) {
        await page.setCookie({
          name: "spt_session",
          value: sessionCookie,
          domain: urlObj.hostname,
          path: "/",
          httpOnly: true,
        });
      }

      await page.emulateMediaType("print");
      await page.goto(url, {
        waitUntil: ["load", "networkidle0"],
        timeout: 25000,
      });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
        preferCSSPageSize: true,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close().catch(() => {});
    }
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    activePdfJobs = Math.max(0, activePdfJobs - 1);
  }
}
