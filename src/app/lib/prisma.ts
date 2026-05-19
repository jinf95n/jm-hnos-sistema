import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error'],
  // Esto ayuda a que Prisma no abra infinitas conexiones
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma