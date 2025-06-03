-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'MOBILE');

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('processing', 'ready');

-- AlterTable
ALTER TABLE "ClientUser" ADD COLUMN     "preferredContact" "ContactMethod" NOT NULL DEFAULT 'EMAIL';

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" "TestStatus" NOT NULL DEFAULT 'processing',
    "resultUrl" TEXT,
    "orderId" TEXT NOT NULL,
    "bloodTestId" TEXT NOT NULL,
    "clientId" TEXT,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_bloodTestId_fkey" FOREIGN KEY ("bloodTestId") REFERENCES "BloodTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
