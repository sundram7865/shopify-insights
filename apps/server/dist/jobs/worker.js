import { rabbitMQ } from '../config/rabbitmq.js';
import * as ProductService from '../services/product.service.js';
import * as OrderService from '../services/order.service.js';
import * as CustomerService from '../services/customer.service.js';
export const startWorker = async () => {
    const channel = rabbitMQ.getChannel();
    console.log("👷 Worker started. Listening for Shopify events...");
    channel.consume('shopify-ingestion', async (msg) => {
        if (!msg)
            return;
        try {
            const { type, tenantId, payload } = JSON.parse(msg.content.toString());
            console.log(`⚡ Processing job: ${type} for Tenant: ${tenantId}`);
            switch (type) {
                case 'PRODUCTS':
                    await ProductService.handleProductUpdate(payload, tenantId);
                    break;
                case 'ORDERS':
                    await OrderService.handleOrderUpdate(payload, tenantId);
                    break;
                case 'CUSTOMERS':
                    await CustomerService.handleCustomerUpdate(payload, tenantId);
                    break;
                case 'CHECKOUTS':
                    // Bonus: Just logging for now to prove we received it
                    console.log(`🛒 Checkout event logged for ${tenantId}`);
                    break;
                default:
                    console.warn(`⚠️ Unknown job type: ${type}`);
            }
            channel.ack(msg); // Acknowledge success (removes from queue)
        }
        catch (error) {
            console.error("❌ Worker Error:", error);
            // Nack (Negative Ack) tells RabbitMQ the job failed. 
            // false = don't requeue immediately (prevents infinite loop crashes)
            channel.nack(msg, false, false);
        }
    });
};
//# sourceMappingURL=worker.js.map