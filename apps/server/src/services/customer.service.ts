import { prisma } from '../config/db.js';

export const handleCustomerUpdate = async (payload: any[], tenantId: string) => {
  for (const cust of payload) {
    await prisma.customer.upsert({
      where: { shopifyCustomerId_tenantId: { shopifyCustomerId: String(cust.id), tenantId } },
      update: { 
        totalSpent: cust.total_spent || 0,
        email: cust.email
      },
      create: {
        shopifyCustomerId: String(cust.id),
        email: cust.email,
        totalSpent: cust.total_spent || 0,
        tenantId
      }
    });
  }
  console.log(`✅ [Service] Processed ${payload.length} customers`);
};