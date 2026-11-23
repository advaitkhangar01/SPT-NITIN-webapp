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

// Optimize SQLite for high-performance concurrent read/write transactions:
// - WAL mode: concurrent reads without blocking writes
// - synchronous = NORMAL: safe against power loss in WAL, eliminates blocking disk fsync
// - mmap_size = 268435456 (256MB): memory-mapped zero-copy I/O
// - cache_size = -64000 (64MB): keeps hot pages entirely in RAM
// - temp_store = MEMORY: sorts and temp tables in RAM
// - busy_timeout = 5000: avoid lock contention
export async function configureSqlitePragmas(client: PrismaClient = prisma) {
  try {
    await client.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
    await client.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
    await client.$queryRawUnsafe("PRAGMA cache_size = -64000;");
    await client.$queryRawUnsafe("PRAGMA mmap_size = 268435456;");
    await client.$queryRawUnsafe("PRAGMA temp_store = MEMORY;");
    await client.$queryRawUnsafe("PRAGMA busy_timeout = 5000;");
  } catch (err) {
    // Ignored if provider is not SQLite
  }
}

if (!globalForPrisma.pragmasConfigured) {
  globalForPrisma.pragmasConfigured = true;
  configureSqlitePragmas(prisma);
}
