const puppeteer = require("puppeteer");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function capture() {
  console.log("Capturing rendered invoice...");

  const prisma = new PrismaClient();
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.update({
    where: { username: "nitin" },
    data: { passwordHash: hash, mustChangePassword: false },
  });

  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "nitin", password: "admin123" }),
  });
  const cookieHeader = loginRes.headers.get("set-cookie");
  const tokenMatch = cookieHeader && cookieHeader.match(/spt_session=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : "";

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1280, deviceScaleFactor: 2 });

  await page.setCookie({
    name: "spt_session",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
  });

  const inv = await prisma.invoice.findFirst({
    where: { invoiceNumber: "INV-2026-001" },
  });

  if (!inv) {
    console.error("No invoice found with INV-2026-001");
    await browser.close();
    await prisma.$disconnect();
    return;
  }

  const url = `http://localhost:3000/invoices/${inv.id}/print`;
  await page.goto(url, { waitUntil: "networkidle0" });

  const outputPath = path.join(__dirname, "invoice-rendered-preview.png");
  await page.screenshot({ path: outputPath, fullPage: false });
  console.log("Screenshot saved to:", outputPath);

  await prisma.$disconnect();
  await browser.close();
}

capture().catch(console.error);
