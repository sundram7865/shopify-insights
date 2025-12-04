import { Router } from 'express';
import * as AnalyticsController from '../controllers/analytics.controller.js';

const router = Router();

// Middleware: Ensure every request has a tenantId
const requireTenant = (req: any, res: any, next: any) => {
    const tenantId = req.query.tenantId;
    if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId param" });
    }
    next();
};

router.get('/stats', requireTenant, AnalyticsController.getStats);
router.get('/sales-over-time', requireTenant, AnalyticsController.getSalesOverTime);
router.get('/top-customers', requireTenant, AnalyticsController.getTopCustomers);
router.get('/customer-segments', requireTenant, AnalyticsController.getCustomerSegments);

export default router;