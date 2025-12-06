import amqp from 'amqplib';
import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();
class RabbitMQService {
    connection = null;
    channel = null;
    async connect() {
        if (this.connection) {
            return; // Already connected
        }
        try {
            console.log("🐰 Connecting to RabbitMQ...");
            // Use the full URL if provided (Easiest for CloudAMQP)
            // OR construct it from individual parts (Easiest for AWS/Docker)
            let connectionUrl = process.env.RABBITMQ_URL;
            if (!connectionUrl) {
                const host = process.env.RABBITMQ_HOST || 'localhost';
                const port = process.env.RABBITMQ_PORT || '5672';
                const user = process.env.RABBITMQ_USER || 'guest';
                const pass = process.env.RABBITMQ_PASSWORD || 'guest';
                connectionUrl = `amqp://${user}:${pass}@${host}:${port}`;
            }
            const conn = await amqp.connect(connectionUrl);
            this.connection = conn;
            const channel = await conn.createChannel();
            this.channel = channel;
            // Assert the ingestion queue exists
            await channel.assertQueue('shopify-ingestion', { durable: true });
            console.log("✅ RabbitMQ Connected Successfully");
            // Handle connection close events
            conn.on("close", () => {
                console.error("❌ RabbitMQ Connection Closed");
                this.connection = null;
                this.channel = null;
            });
            conn.on("error", (err) => {
                console.error("❌ RabbitMQ Connection Error", err);
            });
        }
        catch (error) {
            console.error("❌ Failed to connect to RabbitMQ:", error);
        }
    }
    getChannel() {
        if (!this.channel) {
            throw new Error("RabbitMQ channel not initialized. Call connect() first.");
        }
        return this.channel;
    }
}
// Export a singleton instance
export const rabbitMQ = new RabbitMQService();
//# sourceMappingURL=rabbitmq.js.map