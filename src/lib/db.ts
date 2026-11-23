import { PrismaClient } from "@prisma/client";

// Satu instance PrismaClient agar hot-reload saat `next dev` tidak membuka koneksi baru terus-menerus.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
