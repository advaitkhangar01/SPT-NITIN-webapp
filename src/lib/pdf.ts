import puppeteer, { Browser } from "puppeteer";

let cachedBrowser: Browser | null = null;
let idleCloseTimer: NodeJS.Timeout | null = null;
let activePdfJobs = 0;
const MAX_CONCURRENT_PDF_JOBS = 2;
const IDLE_BROWSER_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes idle cleanup
const jobQueue: (() => void)[] = [];

/**
 * Returns a warm singleton browser instance, launching one if needed.
 */
async function getWarmBrowser(): Promise<Browser> {
  if (idleCloseTimer) {
    clearTimeout(idleCloseTimer);
    idleCloseTimer = null;
  }

  if (cachedBrowser && cachedBrowser.connected) {
    return cachedBrowser;
  }

  // Launch a new warm headless Chromium process
  cachedBrowser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-first-run",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-sync",
      "--mute-audio",
      "--hide-scrollbars",
      "--disable-translate",
      "--disable-features=TranslateUI",
      "--disable-component-update",
      "--font-render-hinting=none",
    ],
  });

  cachedBrowser.once("disconnected", () => {
    cachedBrowser = null;
  });

  return cachedBrowser;
}

/**
 * Schedules closing the warm browser if idle for a period of time to preserve VPS RAM.
 */
function scheduleIdleCleanup() {
  if (idleCloseTimer) {
    clearTimeout(idleCloseTimer);
  }

  if (activePdfJobs === 0 && jobQueue.length === 0 && cachedBrowser && cachedBrowser.connected) {
    idleCloseTimer = setTimeout(async () => {
      if (activePdfJobs === 0 && jobQueue.length === 0 && cachedBrowser) {
        try {
          await cachedBrowser.close();
        } catch {}
        cachedBrowser = null;
      }
    }, IDLE_BROWSER_TIMEOUT_MS);
  }
}

/**
 * Acquire concurrency slot, queueing if maximum concurrent jobs are active.
 */
async function acquireJobSlot(timeoutMs = 15000): Promise<() => void> {
  if (activePdfJobs < MAX_CONCURRENT_PDF_JOBS) {
    activePdfJobs++;
    return releaseJobSlot;
  }

  return new Promise<() => void>((resolve, reject) => {
    const timer = setTimeout(() => {
      const idx = jobQueue.indexOf(runNext);
      if (idx !== -1) jobQueue.splice(idx, 1);
      reject(new Error("Server is currently busy generating other PDF documents. Please retry."));
    }, timeoutMs);

    const runNext = () => {
      clearTimeout(timer);
      activePdfJobs++;
      resolve(releaseJobSlot);
    };

    jobQueue.push(runNext);
  });
}

function releaseJobSlot() {
  activePdfJobs = Math.max(0, activePdfJobs - 1);
  const next = jobQueue.shift();
  if (next) {
    next();
  } else {
    scheduleIdleCleanup();
  }
}

export async function generatePdfFromUrl(url: string, sessionCookie?: string): Promise<Buffer> {
  const urlObj = new URL(url);
  // SSRF Protection: strictly allow only loopback addresses
  if (urlObj.hostname !== "127.0.0.1" && urlObj.hostname !== "localhost") {
    throw new Error("Security Error: Target host is restricted to local server.");
  }

  const release = await acquireJobSlot();

  try {
    const browser = await getWarmBrowser();
    const page = await browser.newPage();

    try {
      // Set exact A4 standard viewport (794x1123 @ 96 DPI) with 2x scale for sharp vectors
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 2,
      });

      if (sessionCookie) {
        await page.setCookie({
          name: "spt_session",
          value: sessionCookie,
          url: urlObj.origin,
          path: "/",
          httpOnly: true,
        });
      }

      await page.emulateMediaType("print");

      // Fast navigation using domcontentloaded instead of networkidle0 (saves 500ms+ idle wait)
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });

      // Ensure all web fonts and critical images are fully loaded and rendered
      await page.evaluate(async () => {
        if (document.fonts) {
          await document.fonts.ready;
        }
        const pendingImages = Array.from(document.images)
          .filter((img) => !img.complete)
          .map((img) => new Promise((resolve) => {
            img.onload = img.onerror = resolve;
          }));
        if (pendingImages.length > 0) {
          await Promise.all(pendingImages);
        }
      });

      // Brief settle delay to ensure CSS transitions & layouts are finalized
      await new Promise((resolve) => setTimeout(resolve, 60));

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
    release();
  }
}
