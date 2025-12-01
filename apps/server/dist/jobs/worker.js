import { rabbitMQ } from '../config/rabbitmq.js';
import { prisma } from '../config/db.js';
export const startWorker = async () => {
    const channel = rabbitMQ.getChannel();
    console.log("👷 Worker started. Listening for Shopify data...");
    channel.consume('shopify-ingestion', async (msg) => {
        if (!msg)
            return;
        try {
            const { type, tenantId, payload } = JSON.parse(msg.content.toString());
            console.log(`Processing ${type} for Tenant ${tenantId}`);
            if (type === 'PRODUCTS') {
                for (const item of payload) {
                    await prisma.product.upsert({
                        where: {
                            shopifyProductId_tenantId: {
                                shopifyProductId: String(item.id),
                                tenantId: tenantId
                            }
                        },
                        update: { title: item.title, price: item.variants?.[0]?.price || 0 },
                        create: {
                            shopifyProductId: String(item.id),
                            title: item.title,
                            price: item.variants?.[0]?.price || 0,
                            tenantId: tenantId
                        }
                    });
                }
            }
            else if (type === 'ORDERS') {
                for (const order of payload) {
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
                            tenantId: tenantId
                        }
                    });
                }
            }
            channel.ack(msg); // Confirm success
        }
        catch (error) {
            console.error("❌ Worker Failed:", error);
            channel.nack(msg, false, false); // Fail safely
        }
    });
};
//# sourceMappingURL=worker.js.map