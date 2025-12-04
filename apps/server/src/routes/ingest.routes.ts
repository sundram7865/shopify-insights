import { Router } from 'express';
import * as IngestController from '../controllers/ingest.controller.js';

const router = Router();

router.post('/webhook', IngestController.handleWebhook);

export default router;