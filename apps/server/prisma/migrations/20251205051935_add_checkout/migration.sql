-- CreateTable
CREATE TABLE "Checkout" (
    "id" TEXT NOT NULL,
    "shopifyCheckoutId" TEXT NOT NULL,
    "email" TEXT,
    "totalPrice" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "abandonedCheckoutUrl" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Checkout_shopifyCheckoutId_tenantId_key" ON "Checkout"("shopifyCheckoutId", "tenantId");

-- AddForeignKey
ALTER TABLE "Checkout" ADD CONSTRAINT "Checkout_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
