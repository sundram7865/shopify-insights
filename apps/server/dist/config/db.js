import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
// 1. Load env vars immediately
dotenv.config();
const url = process.env.DATABASE_URL;
// 2. Safety check
if (!url) {
    throw new Error("❌ DATABASE_URL is missing in .env file");
}
export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url,
        },
    },
});
//# sourceMappingURL=db.js.map