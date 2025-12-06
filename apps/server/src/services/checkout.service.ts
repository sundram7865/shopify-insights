import { prisma } from '../config/db.js';

export const handleCheckoutUpdate = async (payload: any[], tenantId: string) => {
  for (const checkout of payload) {
    await prisma.checkout.upsert({
      where: {
        shopifyCheckoutId_tenantId: {
          shopifyCheckoutId: String(checkout.id),
          tenantId: tenantId
        }
      },
      update: {
        email: checkout.email || null,
        totalPrice: checkout.total_price || 0,
        abandonedCheckoutUrl: checkout.abandoned_checkout_url,
        updatedAt: new Date() // Updates timestamp whenever they modify cart
      },
      create: {
        shopifyCheckoutId: String(checkout.id),
        email: checkout.email || null,
        totalPrice: checkout.total_price || 0,
        currency: checkout.currency || "USD",
        abandonedCheckoutUrl: checkout.abandoned_checkout_url,
        tenantId: tenantId
      }
    });
  }
  console.log(`🛒 [Service] Processed ${payload.length} checkouts`);
};