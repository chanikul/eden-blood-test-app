import { mockBloodTests } from './test-utils';

// Mock PrismaClient
const mockPrismaClient = {
  bloodTest: {
    findMany: async () => mockBloodTests,
  },
};

// Mock the Prisma module
process.env.MOCK_PRISMA = 'true';

// Export for use in tests
export { mockPrismaClient };
