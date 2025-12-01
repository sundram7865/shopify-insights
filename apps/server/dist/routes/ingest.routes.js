import { Router } from 'express';
import { rabbitMQ } from '../config/rabbitmq.js';
import { prisma } from '../config/db.js';
const router = Router();
router.post('/webhook', async (req, res) => {
    try {
        const { tenantId, topic, data } = req.body;
        // 1. Security Check: Does this Tenant exist?
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            res.status(404).json({ error: "Tenant not found" });
            return;
        }
        // 2. Async Ingestion: Send to RabbitMQ
        const channel = rabbitMQ.getChannel();
        channel.sendToQueue('shopify-ingestion', Buffer.from(JSON.stringify({
            type: topic, // e.g., 'PRODUCTS' or 'ORDERS'
            tenantId,
            payload: data
        })));
        // 3. Immediate Response (Shopify expects < 500ms response)
        res.status(202).json({ message: "Ingestion Queued" });
    }
    catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
export default router;
//# sourceMappingURL=ingest.routes.js.map