/*
  Warnings:

  - You are about to drop the column `dispatchedBy` on the `Order` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'SUPER_ADMIN');

-- DropIndex
DROP INDEX "BloodTest_stripePriceId_key";

-- DropIndex
DROP INDEX "BloodTest_stripeProductId_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "dispatchedBy",
ADD COLUMN     "dispatchedById" TEXT;

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpires" TIMESTAMP(3),

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_resetToken_key" ON "Admin"("resetToken");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_dispatchedById_fkey" FOREIGN KEY ("dispatchedById") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
