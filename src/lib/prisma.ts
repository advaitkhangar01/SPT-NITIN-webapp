import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pragmasConfigured?: boolean;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Optimize SQLite for concurrent read/write transactions (WAL mode + busy_timeout)
if (!globalForPrisma.pragmasConfigured) {
  globalForPrisma.pragmasConfigured = true;
  (async () => {
    try {
      await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
      await prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000;");
      await prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
    } catch (err) {
      // Ignored if provider is not SQLite
    }
  })();
}
