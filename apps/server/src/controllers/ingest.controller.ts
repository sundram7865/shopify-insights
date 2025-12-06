import crypto from 'crypto';
import { Request, Response } from 'express';
import { rabbitMQ } from '../config/rabbitmq.js';
import { prisma } from '../config/db.js';

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const hmac = req.header('X-Shopify-Hmac-Sha256');
    const topic = req.header('X-Shopify-Topic');
    
    const secret = process.env.SHOPIFY_API_SECRET;
    if (!secret) {
      console.error('❌ SHOPIFY_API_SECRET is not set');
      return res.status(500).send('Server Configuration Error');
    }

    
    const rawBody = (req as any).rawBody;

    if (!rawBody) {
       console.error('❌ No raw body found. Ensure express.json({ verify: ... }) is set in app.ts');
       
       return res.status(500).send('Internal Server Error: Raw body missing');
    }

    const digest = crypto
      .createHmac('sha256', secret)
      .update(rawBody) 
      .digest('base64');

    if (digest !== hmac) {
      console.error('❌ Unauthorized webhook signature mismatch');
      console.log(`Expected: ${hmac}`);
      console.log(`Calculated: ${digest}`);
      return res.status(401).send('Unauthorized');
    }

    const tenantId = req.query.tenantId as string; 
    const shopifyTopic = topic as string;
    const payload = req.body; 

    console.log(`📥 Received webhook: '${shopifyTopic}' for Tenant: ${tenantId}`);

    if (!tenantId || !shopifyTopic) {
        return res.status(400).send("Missing parameters");
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      console.error(`❌ Tenant not found: ${tenantId}`);
      return res.status(404).json({ error: "Tenant not found" });
    }

    const workerType = (shopifyTopic.split('/')[0] || '').toUpperCase(); 

    const messageData = {
      type: workerType, 
      tenantId,
      payload: [payload]
    };

    const channel = rabbitMQ.getChannel();
    channel.sendToQueue('shopify-ingestion', Buffer.from(JSON.stringify(messageData)));

    console.log(`✅ Queued ${workerType} event`);
    res.status(200).send("OK");

  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};