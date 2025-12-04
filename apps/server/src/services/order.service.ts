import { prisma } from '../config/db.js';

export const handleOrderUpdate = async (payload: any[], tenantId: string) => {
  for (const order of payload) {
    let dbCustomerId = null;

    // 1. Ensure Customer exists first to link properly
    if (order.customer) {
      const savedCustomer = await prisma.customer.upsert({
        where: { shopifyCustomerId_tenantId: { shopifyCustomerId: String(order.customer.id), tenantId } },
        update: { 
          totalSpent: order.customer.total_spent || 0,
          email: order.customer.email || "no-email@recorded.com" 
        },
        create: {
          shopifyCustomerId: String(order.customer.id),
          email: order.customer.email || "no-email@recorded.com",
          totalSpent: order.customer.total_spent || 0,
          tenantId
        }
      });
      dbCustomerId = savedCustomer.id;
    }

    // 2. Create the Order
    await prisma.order.upsert({
      where: {
        shopifyOrderId_tenantId: {
          shopifyOrderId: String(order.id),
          tenantId: tenantId
        }
      },
      update: { totalPrice: order.total_price },
      create: {
        shopifyOrderId: String(order.id),
        totalPrice: order.total_price,
        currency: order.currency || "USD",
        customerId: dbCustomerId, 
        tenantId: tenantId
      }
    });
    
    console.log(`✅ [Service] Order ${order.id} saved (Customer Linked: ${!!dbCustomerId})`);
  }
};