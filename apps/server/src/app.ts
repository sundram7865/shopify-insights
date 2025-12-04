import express from 'express';
import cors from 'cors';
import { rabbitMQ } from './config/rabbitmq.js';
import { startWorker } from './jobs/worker.js';
import ingestRoutes from './routes/ingest.routes.js';
import { prisma } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
const app = express();

app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api', ingestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.get('/',(req, res) => res.send('Hellorld!'));
const init = async () => {
  // 1. Connect to Infrastructure
  await rabbitMQ.connect();
  
  // 2. Start Background Worker
  startWorker();
  
  // 3. Create Demo Tenant (So you can test immediately)
  const demoUrl = "demo-store.myshopify.com";
  const existing = await prisma.tenant.findUnique({ where: { storeUrl: demoUrl } });
  
  if (!existing) {
     const t = await prisma.tenant.create({
       data: { 
         storeName: "Xeno Demo Store", 
         storeUrl: demoUrl, 
         apiToken: "demo_token_123" 
       }
     });
     console.log(`ℹ️  Created Demo Tenant ID: ${t.id}`);
  } else {
     console.log(`ℹ️  Using Existing Tenant ID: ${existing.id}`);
  }

  app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
  });
};

init();