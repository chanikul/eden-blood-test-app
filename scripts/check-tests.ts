import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkBloodTests() {
  try {
    const tests = await prisma.bloodTest.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        stripeProductId: true,
        isActive: true
      }
    })
    
    console.log('Number of active blood tests:', tests.length)
    console.log('Tests:', tests)
  } catch (error) {
    console.error('Error checking blood tests:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBloodTests()
