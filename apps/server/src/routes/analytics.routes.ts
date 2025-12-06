import { Router, Request, Response, NextFunction } from 'express';
import * as AnalyticsController from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();


const requireTenant = (req: Request, res: Response, next: NextFunction) => {
    
    const user = req.user;

    if (!user || !user.tenantId) {
        return res.status(403).json({ error: "Forbidden: User has no tenant association" });
    }

    next();
};


router.use(authenticate);


router.get('/stats', requireTenant, AnalyticsController.getStats);
router.get('/sales-over-time', requireTenant, AnalyticsController.getSalesOverTime);
router.get('/top-customers', requireTenant, AnalyticsController.getTopCustomers);
router.get('/customer-segments', requireTenant, AnalyticsController.getCustomerSegments);
router.get('/customers', requireTenant, AnalyticsController.getCustomers);
router.get('/products', requireTenant, AnalyticsController.getProducts);

export default router;