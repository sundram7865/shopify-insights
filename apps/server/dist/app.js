import express from 'express';
import cors from 'cors';
import { rabbitMQ } from './config/rabbitmq.js';
import { startWorker } from './jobs/worker.js';
import ingestRoutes from './routes/ingest.routes.js';
import authRoutes from './routes/auth.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', ingestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.get('/', (req, res) => res.send('Xeno Internship Backend Running!'));
const init = async () => {
    try {
        await rabbitMQ.connect();
        startWorker();
        app.listen(3000, () => {
            console.log("🚀 Server running on http://localhost:3000");
        });
    }
    catch (error) {
        console.error("Failed to start app:", error);
        process.exit(1);
    }
};
init();
//# sourceMappingURL=app.js.map