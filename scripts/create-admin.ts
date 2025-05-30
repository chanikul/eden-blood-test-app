import { PrismaClient, AdminRole } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createInitialAdmin() {
  const email = 'admin@edenclinic.co.uk'
  const password = 'Admin123!' // This will need to be changed after first login
  
  try {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    })

    if (existingAdmin) {
      console.log('Admin user already exists')
      return
    }

    const passwordHash = await bcrypt.hash(password, 10)
    
    const admin = await prisma.admin.create({
      data: {
        email,
        name: 'Admin',
        passwordHash,
        role: AdminRole.SUPER_ADMIN,
        active: true
      }
    })

    console.log('Created admin user:', admin.email)
  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createInitialAdmin()
