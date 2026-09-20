import { prisma } from "./prisma";

export interface CompanySnapshot {
  companyName: string;
  displayName: string;
  tagline: string;
  gstNumber: string;
  phone: string;
  email: string;
  address: string;
  logoPath: string;
}

export async function getCompanySettingsSnapshot(): Promise<CompanySnapshot> {
  let settings = await prisma.companySettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: { id: "default" },
    });
  }

  return {
    companyName: settings.companyName,
    displayName: settings.displayName,
    tagline: settings.tagline,
    gstNumber: settings.gstNumber,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    logoPath: settings.logoPath || "/logo.png",
  };
}

export function parseCompanySnapshot(snapshotStr: string | null | undefined, fallback?: CompanySnapshot): CompanySnapshot {
  if (!snapshotStr) {
    return (
      fallback || {
        companyName: "Shashikala Power Tech",
        displayName: "SHASHIKALAA POWER TECK",
        tagline: "SOLAR & ENERGY SOLUTIONS",
        gstNumber: "27AJRPN3091N1ZE",
        phone: "+91 95271 61595",
        email: "shashikalapowertech@gmail.com",
        address: "Plot No. 80, Shivaji Colony, Behind Nasare Hall, Hudkeshwar Road, Nagpur-440034",
        logoPath: "/logo.png",
      }
    );
  }

  try {
    return JSON.parse(snapshotStr);
  } catch (err) {
    return (
      fallback || {
        companyName: "Shashikala Power Tech",
        displayName: "SHASHIKALAA POWER TECK",
        tagline: "SOLAR & ENERGY SOLUTIONS",
        gstNumber: "27AJRPN3091N1ZE",
        phone: "+91 95271 61595",
        email: "shashikalapowertech@gmail.com",
        address: "Plot No. 80, Shivaji Colony, Behind Nasare Hall, Hudkeshwar Road, Nagpur-440034",
        logoPath: "/logo.png",
      }
    );
  }
}
