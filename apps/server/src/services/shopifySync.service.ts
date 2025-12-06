import { prisma } from '../config/db.js';

// Helper to add delay between API calls (Shopify Rate Limits)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const SHOPIFY_API_VERSION = '2024-01';

/**
 * Fetches data from Shopify and Upserts (Create or Update) into Prisma
 * USES NATIVE FETCH (No Axios, No Import Errors)
 */
const syncTenantData = async (tenantId: string, shopDomain: string, accessToken: string) => {
    console.log(`[Sync] Starting sync for tenant: ${tenantId}`);
    
    const shopifyUrl = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}`;
    const headers = { 
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
    };

    try {
        // --- 1. SYNC CUSTOMERS ---
        console.log(`[Sync] Fetching Customers for ${shopDomain}...`);
        const customerResponse = await fetch(`${shopifyUrl}/customers.json?limit=250`, { headers });
        if (!customerResponse.ok) throw new Error(`Shopify API Error: ${customerResponse.statusText}`);
        const customerData: any = await customerResponse.json();
        
        for (const customer of customerData.customers) {
            const existingCustomer = await prisma.customer.findFirst({
                where: { 
                    email: String(customer.email),
                    tenantId: tenantId
                }
            });

            // Removed firstName/lastName/phone to match current Prisma Schema requirements
            
            if (existingCustomer) {
                // Schema currently has no mutable fields (name, phone removed)
                // Skipping update to prevent "No data" errors
            } else {
                await prisma.customer.create({
                    data: {
                        email: String(customer.email),
                        tenantId: tenantId,
                        shopifyCustomerId: String(customer.id)
                    }
                });
            }
        }

        // --- 2. SYNC PRODUCTS ---
        console.log(`[Sync] Fetching Products for ${shopDomain}...`);
        const productResponse = await fetch(`${shopifyUrl}/products.json?limit=250`, { headers });
        if (!productResponse.ok) throw new Error(`Shopify API Error: ${productResponse.statusText}`);
        const productData: any = await productResponse.json();

        for (const product of productData.products) {
            const existingProduct = await prisma.product.findFirst({
                where: { 
                    shopifyProductId: String(product.id),
                    tenantId: tenantId 
                }
            });

            const title = String(product.title);
            const price = parseFloat(product.variants[0]?.price || '0');
            // Removed stock/inventory to match current Prisma Schema requirements

            if (existingProduct) {
                await prisma.product.update({
                    where: { id: existingProduct.id },
                    data: { title, price }
                });
            } else {
                await prisma.product.create({
                    data: {
                        title, price,
                        tenantId: tenantId,
                        shopifyProductId: String(product.id)
                    }
                });
            }
        }

        // --- 3. SYNC ORDERS ---
        console.log(`[Sync] Fetching Orders for ${shopDomain}...`);
        const orderResponse = await fetch(`${shopifyUrl}/orders.json?status=any&limit=250`, { headers });
        if (!orderResponse.ok) throw new Error(`Shopify API Error: ${orderResponse.statusText}`);
        const orderData: any = await orderResponse.json();

        for (const order of orderData.orders) {
            const existingOrder = await prisma.order.findFirst({
                where: { shopifyOrderId: String(order.id) }
            });

            const totalPrice = parseFloat(order.total_price);
            const customerId = order.customer ? String(order.customer.id) : null;
            const createdAt = new Date(order.created_at);

            if (existingOrder) {
                await prisma.order.update({
                    where: { id: existingOrder.id },
                    data: { totalPrice }
                });
            } else {
                await prisma.order.create({
                    data: {
                        totalPrice, customerId, tenantId, createdAt,
                        shopifyOrderId: String(order.id)
                    }
                });
            }
        }

        console.log(`[Sync] Completed sync for ${shopDomain}`);

    } catch (error) {
        console.error(`[Sync] Error syncing ${shopDomain}:`, error);
    }
};

/**
 * Executes the sync logic safely
 */
const runSyncTask = async () => {
    console.log('[Scheduler] Running hourly sync...');
    
    const demoTenantId = 'tenant_123'; 
    const demoShop = process.env.SHOPIFY_SHOP_DOMAIN;
    const demoToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (demoShop && demoToken) {
         await syncTenantData(demoTenantId, demoShop, demoToken);
    } else {
        console.log('[Scheduler] Missing environment variables for sync demo.');
    }
};

/**
 * The Scheduler
 * Uses standard setInterval (No Node-Cron, No External Deps)
 */
export const startSyncScheduler = () => {
    console.log('[Scheduler] Initializing native interval scheduler...');

    // Run once after 5 seconds to test immediately (optional)
    setTimeout(() => {
        runSyncTask().catch(err => console.error('[Scheduler] Initial Task failed:', err));
    }, 5000);

    // Set interval for 1 hour
    const ONE_HOUR = 60 * 60 * 1000;
    
    setInterval(() => {
        runSyncTask().catch(err => console.error('[Scheduler] Task failed:', err));
    }, ONE_HOUR);
    
    console.log('[Scheduler] Sync Job initialized successfully.');
};