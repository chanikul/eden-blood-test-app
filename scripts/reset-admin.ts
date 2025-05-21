import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetAdminPassword() {
  const email = 'admin@edenclinic.co.uk'
  const newPassword = 'Admin123!'
  
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10)
    
    const admin = await prisma.admin.update({
      where: { email },
      data: { 
        passwordHash,
        active: true
      }
    })

    console.log('Reset password for admin:', admin.email)
  } catch (error) {
    console.error('Error resetting password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetAdminPassword()
