const puppeteer = require("puppeteer");
const path = require("path");

async function capture() {
  console.log("Capturing rendered invoice...");

  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "nitin", password: "admin123" }),
  });
  const cookieHeader = loginRes.headers.get("set-cookie");
  const tokenMatch = cookieHeader && cookieHeader.match(/spt_session=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : "";

  const changeRes = await fetch("http://localhost:3000/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: cookieHeader },
    body: JSON.stringify({ currentPassword: "admin123", newPassword: "AdminPassword123!" }),
  });
  const updatedCookie = changeRes.headers.get("set-cookie") || cookieHeader;
  const updatedTokenMatch = updatedCookie && updatedCookie.match(/spt_session=([^;]+)/);
  const finalToken = updatedTokenMatch ? updatedTokenMatch[1] : token;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 1280, deviceScaleFactor: 2 });

  await page.setCookie({
    name: "spt_session",
    value: finalToken,
    domain: "localhost",
    path: "/",
    httpOnly: true,
  });

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const inv = await prisma.invoice.findFirst({
    where: { invoiceNumber: "INV-2026-001" },
  });

  const url = `http://localhost:3000/invoices/${inv.id}/print`;
  await page.goto(url, { waitUntil: "networkidle0" });

  const outputPath = path.join(__dirname, "invoice-rendered-preview.png");
  await page.screenshot({ path: outputPath, fullPage: false });
  console.log("Screenshot saved to:", outputPath);

  const bcrypt = require("bcryptjs");
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.update({
    where: { username: "nitin" },
    data: { passwordHash: hash, mustChangePassword: true },
  });
  await prisma.$disconnect();

  await browser.close();
}

capture().catch(console.error);
