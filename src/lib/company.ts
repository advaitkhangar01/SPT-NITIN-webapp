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
  accountName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branch?: string;
  panNumber?: string;
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
  const defaultBankData = {
    accountName: "SHASHIKALA POWER TECH",
    accountNumber: "0058107040000460",
    ifscCode: "MSCI0082056",
    bankName: "Maharashtra State Co-operative Bank",
    branch: "Nagpur Branch",
    panNumber: "AJRPN3091N",
  };

  const defaultObj: CompanySnapshot = {
    companyName: "Shashikala Power Tech",
    displayName: "SHASHIKALA POWER TECH",
    tagline: "SOLAR & ENERGY SOLUTIONS",
    gstNumber: "27AJRPN3091N1ZE",
    phone: "+91 95271 61595",
    email: "contact@shashikalapowertech.com",
    address: "Plot No. 80, Shivaji Colony, Behind Nasare Hall, Hudkeshwar Road, Nagpur-440034",
    logoPath: "/logo.png",
    ...defaultBankData,
  };

  if (!snapshotStr) {
    return fallback ? { ...defaultBankData, ...fallback } : defaultObj;
  }

  try {
    const parsed = JSON.parse(snapshotStr);
    return {
      ...defaultBankData,
      ...(fallback || {}),
      ...parsed,
    };
  } catch (err) {
    return fallback ? { ...defaultBankData, ...fallback } : defaultObj;
  }
}

