import { prisma } from '../config/db.js';

export const handleProductUpdate = async (payload: any[], tenantId: string) => {
  for (const item of payload) {
    await prisma.product.upsert({
      where: {
        shopifyProductId_tenantId: {
          shopifyProductId: String(item.id),
          tenantId: tenantId
        }
      },
      update: { 
        title: item.title, 
        price: item.variants?.[0]?.price || 0 
      },
      create: {
        shopifyProductId: String(item.id),
        title: item.title,
        price: item.variants?.[0]?.price || 0,
        tenantId: tenantId
      }
    });
  }
  console.log(`✅ [Service] Processed ${payload.length} products`);
};






