import { PrismaClient } from '@prisma/client'

const prismaGlobal = global as unknown as { prisma: PrismaClient }

export const prisma =
  prismaGlobal.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: "postgresql://postgres.dlzfhnnwyvddaoikrung:DNE8ytm_uyw1jbc*qbr@aws-0-eu-west-2.pooler.supabase.com:5432/postgres"
      }
    }
  })

if (process.env.NODE_ENV !== 'production') {
  prismaGlobal.prisma = prisma
}
