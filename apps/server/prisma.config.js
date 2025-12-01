import { defineConfig } from "prisma/config";
import dotenv from "dotenv";
import path from "path";
// 1. Load env explicitly from current directory
dotenv.config({ path: path.join(process.cwd(), ".env") });
export default defineConfig({
    schema: "prisma/schema.prisma",
    // 2. Defaulting migrations path is safer
    datasource: {
        // Direct access to process.env is more robust in some environments
        url: process.env.DATABASE_URL,
    },
});
//# sourceMappingURL=prisma.config.js.map