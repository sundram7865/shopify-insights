import { defineConfig } from "prisma/config";
import dotenv from "dotenv";
import path from "path";
// Load .env from root
dotenv.config({ path: path.join(process.cwd(), ".env") });
export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url: process.env.DATABASE_URL, // Prisma v7 requires explicit injection
    },
});
//# sourceMappingURL=prisma.config.js.map