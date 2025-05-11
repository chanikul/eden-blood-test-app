const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testConnection() {
  try {
    const result = await prisma.$connect()
    console.log('Successfully connected to the database!')
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error connecting to the database:', error)
  }
}

testConnection()
