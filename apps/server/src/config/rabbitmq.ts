import amqp, { Channel, Connection } from 'amqplib';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

class RabbitMQService {
  private connection: Connection | null = null;
  private channel: Channel | null = null;

  async connect() {
    if (this.connection) {
      return; // Already connected
    }

    try {
      console.log("🐰 Connecting to RabbitMQ...");

      // FIX: Explicitly type the result of the connect call.
      // We rely on the library's return type but assert it conforms to the Connection interface 
      // where it matters. 'as any' is the nuclear option but sometimes necessary with 
      // strict libraries like this to avoid 'ChannelModel' errors.
      // However, a safer bet here is just `as Connection` which *should* work if imports are correct.
      // If `as Connection` failed before, `as unknown as Connection` is the standard workaround.
      
      // Let's try the most robust fix:
      const conn = await amqp.connect({
        protocol: "amqp",
        hostname: process.env.RABBITMQ_HOST || 'localhost',
        port: parseInt(process.env.RABBITMQ_PORT || '5672'),
        username: process.env.RABBITMQ_USER || 'user',
        password: process.env.RABBITMQ_PASSWORD || 'password',
      });

      // We assign it to the class property which is typed as Connection.
      // The cast 'as unknown as Connection' handles the structural mismatch.
      this.connection = conn as unknown as Connection;

      // Use the local variable 'conn' which TS infers correctly from the library
      // This is the key: don't use 'this.connection' immediately for creation
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

    } catch (error) {
      console.error("❌ Failed to connect to RabbitMQ:", error);
    }
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new Error("RabbitMQ channel not initialized. Call connect() first.");
    }
    return this.channel;
  }
}

// Export a singleton instance
export const rabbitMQ = new RabbitMQService();