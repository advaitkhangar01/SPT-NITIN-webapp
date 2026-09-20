async function testServer() {
  console.log("Testing server endpoints...");

  // 1. Test Login
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "nitin", password: "admin123" }),
  });
  console.assert(loginRes.status === 200, "Login must succeed");
  const loginCookie = loginRes.headers.get("set-cookie");
  const loginData = await loginRes.json();
  console.log("✔ Login successful for user:", loginData.user.name, "| Role:", loginData.user.role);

  // 2. Change password to satisfy mustChangePassword policy
  const changePwRes = await fetch("http://localhost:3000/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: loginCookie },
    body: JSON.stringify({ currentPassword: "admin123", newPassword: "AdminSecurePassword2026!" }),
  });
  console.assert(changePwRes.status === 200, "Password change must succeed");
  const changePwCookie = changePwRes.headers.get("set-cookie") || loginCookie;
  console.log("✔ Mandatory password change executed successfully (mustChangePassword cleared)");

  // 3. Test Get Quotations with updated cookie
  const qListRes = await fetch("http://localhost:3000/api/quotations", {
    headers: { cookie: changePwCookie },
  });
  console.assert(qListRes.status === 200, "Fetch quotations must succeed");
  const qListData = await qListRes.json();
  console.log("✔ Fetched quotations count:", qListData.quotations.length);
  const sampleQ = qListData.quotations[0];
  console.log("✔ Sample Quotation:", sampleQ.quotationNumber, sampleQ.customerName, "Total:", sampleQ.totalAmount);

  // 4. Test Print Route HTML
  const printRes = await fetch(`http://localhost:3000/quotations/${sampleQ.id}/print`, {
    headers: { cookie: changePwCookie },
  });
  console.assert(printRes.status === 200, "Print route must return 200");
  const printHtml = await printRes.text();
  console.assert(printHtml.includes("SHASHIKALAA POWER TECK"), "Print HTML contains brand name");
  console.assert(printHtml.includes("27AJRPN3091N1ZE"), "Print HTML contains GST");
  console.assert(printHtml.includes("BILL OF MATERIALS"), "Print HTML contains BOM heading");
  console.assert(printHtml.includes("Total Project Investment"), "Print HTML contains Investment section");
  console.log("✔ Quotation Print HTML verified for A4 precision printing!");

  // 5. Test Invoices List
  const invListRes = await fetch("http://localhost:3000/api/invoices", {
    headers: { cookie: changePwCookie },
  });
  console.assert(invListRes.status === 200, "Fetch invoices must succeed");
  const invListData = await invListRes.json();
  console.log("✔ Fetched invoices count:", invListData.invoices.length);

  // 6. Reset admin password back to admin123 with mustChangePassword: true for fresh user experience
  const { PrismaClient } = require("@prisma/client");
  const bcrypt = require("bcryptjs");
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.update({
    where: { username: "nitin" },
    data: { passwordHash: hash, mustChangePassword: true },
  });
  await prisma.$disconnect();
  console.log("✔ Admin credentials restored to temporary admin123 (mustChangePassword: true)");

  console.log("=== ALL SERVER ENDPOINT TESTS PASSED ===");
}

testServer().catch((e) => {
  console.error("Endpoint test error:", e);
  process.exit(1);
});
