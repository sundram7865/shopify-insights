import { Router } from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../config/db.js';
const router = Router();
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SCOPES = process.env.SHOPIFY_SCOPES;
const HOST = process.env.HOST;
router.get('/', (req, res) => {
    const shop = req.query.shop;
    if (!shop)
        return res.status(400).send('Missing shop parameter. Example: ?shop=test.myshopify.com');
    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = `${HOST}/api/auth/callback`;
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${SHOPIFY_API_KEY}&scope=${SCOPES}&state=${state}&redirect_uri=${redirectUri}`;
    res.redirect(installUrl);
});
router.get('/callback', async (req, res) => {
    const { shop, hmac, code } = req.query;
    if (!shop || !hmac || !code)
        return res.status(400).send('Required parameters missing');
    try {
        const tokenResponse = await axios.post(`https://${shop}/admin/oauth/access_token`, {
            client_id: SHOPIFY_API_KEY,
            client_secret: SHOPIFY_API_SECRET,
            code,
        });
        const accessToken = tokenResponse.data.access_token;
        const tenant = await prisma.tenant.upsert({
            where: { storeUrl: shop },
            update: { apiToken: accessToken },
            create: {
                storeName: shop.split('.')[0],
                storeUrl: shop,
                apiToken: accessToken
            }
        });
        console.log(`✅ Tenant Registered: ${tenant.id}`);
        const webhookTopics = ['products/create',
            'products/update',
            'orders/create',
            'orders/updated',
            'customers/create',
            'customers/update',
            'checkouts/create',
            'checkouts/update'];
        for (const topic of webhookTopics) {
            await registerWebhook(shop, accessToken, topic, tenant.id);
        }
        res.redirect(`http://localhost:5173?tenantId=${tenant.id}`);
    }
    catch (error) {
        console.error('OAuth Error:', error);
        res.status(500).send('OAuth Failed');
    }
});
async function registerWebhook(shop, token, topic, tenantId) {
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
    }
    catch (err) {
        console.log(`⚠️ Webhook registration skipped for ${topic}: ${err.response?.statusText}`);
    }
}
export default router;
//# sourceMappingURL=auth.routes.js.map