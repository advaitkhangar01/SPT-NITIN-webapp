const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding initial data...");

  // Seed default company settings
  const existingSettings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  });

  if (!existingSettings) {
    await prisma.companySettings.create({
      data: {
        id: "default",
        companyName: "Shashikala Power Tech",
        displayName: "SHASHIKALAA POWER TECK",
        tagline: "SOLAR & ENERGY SOLUTIONS",
        gstNumber: "27AJRPN3091N1ZE",
        phone: "+91 95271 61595",
        email: "shashikalapowertech@gmail.com",
        address: "Plot No. 80, Shivaji Colony, Behind Nasare Hall, Hudkeshwar Road, Nagpur-440034",
        logoPath: "/logo.png",
        quotationPrefix: "QT-",
        invoicePrefix: "INV-",
        nextQuotationNumber: 1,
        nextInvoiceNumber: 1,
        defaultValidityDays: 15,
        defaultGst: 18.0,
      },
    });
    console.log("Default CompanySettings seeded.");
  }

  // Seed default admin user: nitin / admin123 (with mustChangePassword: true)
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "nitin" },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        name: "Nitin Nagpure",
        username: "nitin",
        passwordHash,
        role: "ADMIN",
        mustChangePassword: true,
      },
    });
    console.log("Admin user 'nitin' seeded with temporary password 'admin123' (mustChangePassword=true).");
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
