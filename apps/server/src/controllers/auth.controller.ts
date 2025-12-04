import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../config/db.js';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SCOPES = process.env.SHOPIFY_SCOPES;
const HOST = process.env.HOST;

// Redirect user to Shopify's OAuth consent screen
export const install = (req: Request, res: Response) => {
  const shop = req.query.shop as string;
  if (!shop) return res.status(400).send('Missing shop parameter');

  const state = crypto.randomBytes(16).toString('hex');
  const redirectUri = `${HOST}/api/auth/callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&state=${state}&redirect_uri=${redirectUri}`;

  res.redirect(installUrl);
};

// Handle OAuth callback, save token, and register webhooks
export const callback = async (req: Request, res: Response) => {
  const { shop, hmac, code } = req.query as any;

  if (!shop || !hmac || !code) return res.status(400).send('Required parameters missing');

  try {
    // Exchange auth code for permanent access token
    const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    });

    const accessToken = tokenResponse.data.access_token;

    // Create or update the tenant record
    const tenant = await prisma.tenant.upsert({
      where: { storeUrl: shop },
      update: { apiToken: accessToken },
      create: {
        storeName: shop.split('.')[0],
        storeUrl: shop,
        apiToken: accessToken
      }
    });

    console.log(`✅ Tenant registered: ${tenant.id}`);

    // Register required webhooks for data ingestion
    const webhookTopics = [
      'products/create', 
      'products/update',
      'orders/create', 
      'orders/updated',
      'customers/create',
      'customers/update',
      'checkouts/create', 
      'checkouts/update'
    ];
    
    console.log(`🔄 Registering webhooks for ${shop}...`);

    for (const topic of webhookTopics) {
      await registerWebhook(shop, accessToken, topic, tenant.id);
    }

    console.log("✨ Webhook registration complete");
    
    // Redirect to frontend dashboard
    res.redirect(`http://localhost:5173?tenantId=${tenant.id}`);

  } catch (error) {
    console.error('❌ OAuth failed:', error);
    res.status(500).send('Authentication failed');
  }
};

// Helper to register individual webhooks with Shopify
async function registerWebhook(shop: string, token: string, topic: string, tenantId: string) {
  const webhookUrl = `${HOST}/api/webhook?tenantId=${tenantId}`;
  
  try {
    await axios.post(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      webhook: {
        topic: topic,
        address: webhookUrl,
        format: 'json'
      }
    }, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    console.log(`⚓ Webhook registered: ${topic}`);
  } catch (err: any) {
    // Log error but continue execution (webhook might already exist)
    const errorMsg = err.response?.data?.errors || err.message;
    console.log(`⚠️  Skipped ${topic}: ${JSON.stringify(errorMsg)}`);
  }
}