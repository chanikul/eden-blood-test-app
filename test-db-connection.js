const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testConnection() {
  try {
    // Try to query something simple
    const result = await prisma.$queryRaw`SELECT 1`
    console.log('Database connection successful!')
    console.log('Query result:', result)
  } catch (error) {
    console.error('Database connection failed:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
