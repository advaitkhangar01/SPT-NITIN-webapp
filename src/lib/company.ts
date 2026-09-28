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
  upiId?: string;
  panNumber?: string;
}

export function sanitizeBusinessEmail(email?: string | null): string {
  if (
    !email ||
    typeof email !== "string" ||
    email.trim() === "" ||
    email.toLowerCase().includes("gmail") ||
    email.toLowerCase().includes("@shashikalapowertech.com") ||
    email.toLowerCase().includes("shashikalapowertech")
  ) {
    return "contact@shashikalapowertech.in";
  }
  return email.trim();
}

export async function getCompanySettingsSnapshot(): Promise<CompanySnapshot> {
  try {
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
      email: sanitizeBusinessEmail(settings.email),
      address: settings.address,
      logoPath: settings.logoPath || "/logo.png",
      accountName: settings.accountName || "SHASHIKALA POWER TECH",
      accountNumber: settings.accountNumber || "0058107040000460",
      ifscCode: settings.ifscCode || "MSCI0082056",
      bankName: settings.bankName || "Maharashtra State Co-operative Bank",
      branch: settings.branch || "Nagpur Branch",
      upiId: settings.upiId || "",
    };
  } catch (err) {
    console.error("Error fetching company settings snapshot:", err);
    return parseCompanySnapshot(null);
  }
}

export function parseCompanySnapshot(snapshotStr: string | null | undefined, fallback?: CompanySnapshot): CompanySnapshot {
  const defaultBankData = {
    accountName: "SHASHIKALA POWER TECH",
    accountNumber: "0058107040000460",
    ifscCode: "MSCI0082056",
    bankName: "Maharashtra State Co-operative Bank",
    branch: "Nagpur Branch",
    upiId: "",
  };

  const defaultObj: CompanySnapshot = {
    companyName: "Shashikala Power Tech",
    displayName: "SHASHIKALA POWER TECH",
    tagline: "SOLAR & ENERGY SOLUTIONS",
    gstNumber: "27AJRPN3091N1ZE",
    phone: "+91 95271 61595",
    email: "contact@shashikalapowertech.in",
    address: "Plot No. 80, Shivaji Colony, Behind Nasare Hall, Hudkeshwar Road, Nagpur-440034",
    logoPath: "/logo.png",
    ...defaultBankData,
  };

  if (!snapshotStr) {
    const res = fallback ? { ...defaultBankData, ...fallback } : defaultObj;
    return { ...res, email: sanitizeBusinessEmail(res.email) };
  }

  try {
    const parsed = JSON.parse(snapshotStr);
    const resolvedEmail = sanitizeBusinessEmail(parsed.email || fallback?.email);
    return {
      ...defaultBankData,
      ...(fallback || {}),
      ...parsed,
      email: resolvedEmail,
    };
  } catch (err) {
    const res = fallback ? { ...defaultBankData, ...fallback } : defaultObj;
    return { ...res, email: sanitizeBusinessEmail(res.email) };
  }
}

