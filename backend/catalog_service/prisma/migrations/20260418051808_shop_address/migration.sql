/*
  Warnings:

  - Made the column `address` on table `shops` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "shops" ALTER COLUMN "address" SET NOT NULL;
