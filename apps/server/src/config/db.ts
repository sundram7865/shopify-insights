import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 1. Load env vars immediately
dotenv.config();

const url = process.env.DATABASE_URL;

// 2. Add a safety check. If URL is missing, crash the app intentionally.
if (!url) {
  throw new Error("❌ DATABASE_URL is missing in .env file");
}

// 3. Pass the guaranteed string to Prisma
export const prisma = new PrismaClient({
  datasourceUrl: url,
});