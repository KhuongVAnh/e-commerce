-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "checkout_url" TEXT,
ADD COLUMN     "checkout_url_created_at" TIMESTAMP(3),
ADD COLUMN     "checkout_url_expires_at" TIMESTAMP(3);
