import { Request, Response } from 'express';
import { rabbitMQ } from '../config/rabbitmq.js';
import { prisma } from '../config/db.js';

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const tenantId = req.query.tenantId as string; 
    const shopifyTopic = req.headers['x-shopify-topic'] as string;
    const payload = req.body;

    console.log(`📥 Received webhook: '${shopifyTopic}' for Tenant: ${tenantId}`);

    if (!tenantId || !shopifyTopic) {
        return res.status(400).send("Missing parameters");
    }

    // Validate tenant existence
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      console.error(`❌ Tenant not found: ${tenantId}`);
      return res.status(404).json({ error: "Tenant not found" });
    }

    // Normalize topic for worker consumption (e.g., "products/create" -> "PRODUCTS")
    const workerType = (shopifyTopic.split('/')[0] || '').toUpperCase(); 

    const messageData = {
      type: workerType, 
      tenantId,
      payload: [payload] // Wrap in array for consistent worker processing
    };

    // Push to queue for async processing
    const channel = rabbitMQ.getChannel();
    channel.sendToQueue('shopify-ingestion', Buffer.from(JSON.stringify(messageData)));

    console.log(`✅ Queued ${workerType} event`);
    res.status(200).send("OK");

  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};