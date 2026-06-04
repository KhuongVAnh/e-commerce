ALTER TABLE "commerce_service"."orders"
    ALTER COLUMN "total_amount" TYPE DECIMAL(15,2),
    ALTER COLUMN "shipping_fee" TYPE DECIMAL(15,2);

ALTER TABLE "commerce_service"."order_items"
    ALTER COLUMN "price_snapshot" TYPE DECIMAL(15,2),
    ALTER COLUMN "subtotal" TYPE DECIMAL(15,2);

ALTER TABLE "commerce_service"."payments"
    ALTER COLUMN "amount" TYPE DECIMAL(15,2);
