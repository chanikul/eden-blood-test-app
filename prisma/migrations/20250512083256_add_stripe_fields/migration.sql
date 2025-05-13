/*
  Warnings:

  - A unique constraint covering the columns `[stripeProductId]` on the table `BloodTest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripePriceId]` on the table `BloodTest` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BloodTest" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeProductId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BloodTest_stripeProductId_key" ON "BloodTest"("stripeProductId");

-- CreateIndex
CREATE UNIQUE INDEX "BloodTest_stripePriceId_key" ON "BloodTest"("stripePriceId");
