import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  let dbStatus = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = "error";
  }

  const memoryUsage = process.memoryUsage();

  return NextResponse.json(
    {
      status: dbStatus === "ok" ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      uptimeSec: Math.floor(process.uptime()),
      database: dbStatus,
      latencyMs: Date.now() - startTime,
      memory: {
        rssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
      },
    },
    {
      status: dbStatus === "ok" ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
