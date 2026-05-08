-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'SELLER', 'ADMIN');

-- AlterTable
ALTER TABLE "roles"
ALTER COLUMN "name" TYPE "UserRole"
USING ("name"::"UserRole");