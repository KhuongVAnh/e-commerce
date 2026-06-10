-- CreateTable
CREATE TABLE "product_reviews" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "shop_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "order_item_id" BIGINT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment_text" TEXT,
    "image_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_reviews_rating_check" CHECK ("rating" >= 0 AND "rating" <= 5)
);

-- CreateIndex
CREATE UNIQUE INDEX "product_reviews_order_item_id_key" ON "product_reviews"("order_item_id");

-- CreateIndex
CREATE INDEX "product_reviews_product_id_created_at_idx" ON "product_reviews"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "product_reviews_customer_id_idx" ON "product_reviews"("customer_id");

-- CreateIndex
CREATE INDEX "product_reviews_shop_id_idx" ON "product_reviews"("shop_id");

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
