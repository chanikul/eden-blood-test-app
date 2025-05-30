const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bloodTests = [
    {
      name: 'Eden Well Man',
      slug: 'eden-well-man',
      description: 'Comprehensive health screening for men',
      price: 149.99,
      isActive: true
    },
    {
      name: 'Eden Well Woman',
      slug: 'eden-well-woman',
      description: 'Comprehensive health screening for women',
      price: 149.99,
      isActive: true
    },
    {
      name: 'TRT Review',
      slug: 'trt-review',
      description: 'Testosterone Replacement Therapy monitoring',
      price: 129.99,
      isActive: true
    },
    {
      name: 'Advanced Thyroid Panel',
      slug: 'advanced-thyroid-panel',
      description: 'Detailed thyroid function analysis',
      price: 169.99,
      isActive: true
    }
  ];

  console.log('Creating blood tests...');
  for (const test of bloodTests) {
    await prisma.bloodTest.upsert({
      where: { slug: test.slug },
      update: test,
      create: test
    });
  }
  
  console.log('Creating admin user...');
  const adminPassword = 'admin123'; // You should change this password
  const adminHash = require('bcryptjs').hashSync(adminPassword, 10);
  
  await prisma.admin.upsert({
    where: { email: 'admin@edenclinic.com' },
    update: {
      name: 'Admin User',
      passwordHash: adminHash,
      role: 'ADMIN',
      active: true
    },
    create: {
      email: 'admin@edenclinic.com',
      name: 'Admin User',
      passwordHash: adminHash,
      role: 'ADMIN',
      active: true
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
