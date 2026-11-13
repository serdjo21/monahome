-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('COD');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "note" TEXT,
    "subtotalRsd" INTEGER NOT NULL,
    "shippingRsd" INTEGER NOT NULL DEFAULT 0,
    "totalRsd" INTEGER NOT NULL,
    "accessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT,
    "sku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "variantLabel" TEXT,
    "unitPriceRsd" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotalRsd" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_email_idx" ON "Order"("email");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Zaključava nove tabele za javni Supabase API, kao i ostale.
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;