import { Request, Response } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SCOPES = process.env.SHOPIFY_SCOPES;
const HOST = process.env.HOST;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_123';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const existing = await prisma.tenant.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const tenant = await prisma.tenant.create({
      data: {
        email,
        password: hashedPassword,
        storeName: "Pending Connection", 
      }
    });

    const token = jwt.sign({ id: tenant.id, email: tenant.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: "Registration successful", token, tenantId: tenant.id });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const tenant = await prisma.tenant.findUnique({ where: { email } });
    if (!tenant) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, tenant.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: tenant.id, email: tenant.email }, JWT_SECRET, { expiresIn: '7d' });
    const isShopifyConnected = !!tenant.apiToken;

    res.json({ 
      message: "Login successful", 
      token, 
      tenantId: tenant.id,
      isShopifyConnected 
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};

export const install = (req: Request, res: Response) => {
  const shop = req.query.shop as string;
  const tenantId = req.query.tenantId as string;

  if (!shop || !tenantId) return res.status(400).send('Missing shop or tenantId parameter');

  const statePayload = JSON.stringify({ tenantId, nonce: crypto.randomBytes(16).toString('hex') });
  const state = Buffer.from(statePayload).toString('base64');
  
  const redirectUri = `${HOST}/api/auth/callback`;
  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&state=${state}&redirect_uri=${redirectUri}`;

  res.redirect(installUrl);
};

export const callback = async (req: Request, res: Response) => {
  const { shop, code, state } = req.query as any;

  if (!shop || !code || !state) return res.status(400).send('Required parameters missing');

  try {
    const stateJson = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    const tenantId = stateJson.tenantId;

    if (!tenantId) return res.status(400).send('Invalid state: Missing tenantId');

    const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    });

    const accessToken = tokenResponse.data.access_token;

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        storeName: shop.split('.')[0],
        storeUrl: shop,
        apiToken: accessToken
      }
    });

    console.log(`✅ Shopify Connected for Tenant: ${tenant.email}`);

    const webhookTopics = [
      'products/create', 'products/update',
      'orders/create', 'orders/updated',
      'customers/create', 'customers/update',
      'checkouts/create', 'checkouts/update'
    ];

    for (const topic of webhookTopics) {
      await registerWebhook(shop, accessToken, topic, tenant.id);
    }

    res.redirect(`http://localhost:5173/dashboard?connected=true`);

  } catch (error) {
    console.error('❌ OAuth Failed:', error);
    res.status(500).send('Failed to connect store. Please try again.');
  }
};

async function registerWebhook(shop: string, token: string, topic: string, tenantId: string) {
  const webhookUrl = `${HOST}/api/webhook?tenantId=${tenantId}`;
  try {
    await axios.post(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      webhook: { topic, address: webhookUrl, format: 'json' }
    }, { headers: { 'X-Shopify-Access-Token': token } });
    console.log(`⚓ Webhook registered: ${topic}`);
  } catch (err: any) {
    const errorMsg = err.response?.data?.errors || err.message;
    console.log(`⚠️  Skipped ${topic}: ${JSON.stringify(errorMsg)}`);
  }
}