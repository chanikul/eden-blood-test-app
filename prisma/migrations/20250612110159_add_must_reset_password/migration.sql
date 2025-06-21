-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'READY';

-- DropForeignKey
ALTER TABLE "TestResult" DROP CONSTRAINT "TestResult_bloodTestId_fkey";

-- DropForeignKey
ALTER TABLE "TestResult" DROP CONSTRAINT "TestResult_orderId_fkey";

-- AlterTable
ALTER TABLE "ClientUser" ADD COLUMN     "must_reset_password" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TestResult" ADD COLUMN     "metadata" JSONB;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_bloodTestId_fkey" FOREIGN KEY ("bloodTestId") REFERENCES "BloodTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
