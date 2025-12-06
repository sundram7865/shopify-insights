# 🚀 Real-Time Multi-Tenant Shopify Data Engine

A high-performance, event-driven system designed to ingest, process, and visualize e-commerce data in **real-time**. Built to handle high-concurrency Shopify webhooks securely, reliably, and at scale — even during peak sale events like Black Friday.

---

## 🔗 Live Demonstration

- **Frontend :** https://shopify-insights-seven.vercel.app 
- **Backend :** https://shopify-insights-cg9g.onrender.com/


---

## 🧠 System Architecture

This solution uses an **event-driven architecture** to decouple webhook ingestion from data processing, ensuring no data loss under heavy traffic  all webhook events are first queued, processed asynchronously, and then visualized in real-time.

📌 **System Architecture Diagram**




<img width="2816" height="1536" alt="Gemini_Generated_Image_ulbg70ulbg70ulbg" src="https://github.com/user-attachments/assets/515ae15b-af30-49ae-a3c7-34448bbcda14" />





## 📌 Architectural Decisions & Trade-offs

| Component | Technology | Reason |
|----------|------------|--------|
| **Ingestion API** | Express.js | Fast response & secure HMAC validation to prevent webhook timeout failures |
| **Message Queue** | RabbitMQ | Absorbs traffic spikes & guarantees at-least-once delivery |
| **Worker Service** | Node.js | Background asynchronous processing without blocking requests |
| **Database** | PostgreSQL | Enforces relational consistency and tenant isolation |

---

## ✨ Key Features

### 🔐 1. Multi-Tenancy & Security
- Store-level authentication via Shopify OAuth  
- Row-level isolation using tenantId in all DB relations  
- JWT-secured dashboard access  

### ⚡ 2. Real-Time Data Pipeline
- Webhooks processed asynchronously  
- Orders, customers, and checkouts appear on dashboard within milliseconds  

### 💸 3. Abandoned Checkout Tracking
- Detects non-converted checkouts  
- Automatically marks "Recovered" when a payment event later arrives  

### 📊 4. Interactive Analytics Dashboard
- Total Sales, AOV, RCR  
- High-value customers  
- Time-series performance charts  

---

## 🛠 Technology Stack

| Layer | Tools |
|-------|-------|
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (Neon), Prisma ORM |
| Queue | RabbitMQ (CloudAMQP) |
| Frontend | React.js, Vite, Tailwind, Recharts, Lucide Icons |
| Deployment | Render (API), Vercel (Frontend), Docker |

---

## 📡 API Specification

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create tenant account |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/shopify` | Start OAuth |

### 📦 Webhook Ingestion

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook` | Validates signature & queues Shopify events |

### 📊 Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/stats` | KPIs (Sales, Orders, AOV) |
| GET | `/api/analytics/sales-over-time` | Trend chart data |
| GET | `/api/analytics/top-customers` | Customers sorted by LTV |
| GET | `/api/analytics/checkouts` | Abandoned & recovered checkouts |

---

## 🗄 Database Schema

```
Tenant(id, email, password, shopifyAccessToken)
Product(id, shopifyProductId, title, price, tenantId)
Customer(id, shopifyCustomerId, email, totalSpent, tenantId)
Order(id, shopifyOrderId, totalPrice, customerId, tenantId)
Checkout(id, shopifyCheckoutId, isCompleted, abandonedUrl, tenantId)
```

---

## ⚙️ Local Setup Instructions

### 1️⃣ Clone Repository

```sh
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2️⃣ Install Dependencies

```sh
cd apps/server && npm install
cd ../client && npm install
```

### 3️⃣ Configure Environment Variables

Create `.env` in `apps/server/`:

```
PORT=3000
DATABASE_URL=""
RABBITMQ_URL=""
JWT_SECRET=""
SHOPIFY_API_KEY=""
SHOPIFY_API_SECRET=""
SHOPIFY_SCOPES=""
HOST=""
FRONTEND_URL=""
```

### 4️⃣ Start Backend

```sh
cd apps/server
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 5️⃣ Start Frontend

```sh
cd apps/client
npm run dev
```


