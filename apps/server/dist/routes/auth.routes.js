import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller.js';
const router = Router();
router.get('/', AuthController.install);
router.get('/callback', AuthController.callback);
export default router;
//# sourceMappingURL=auth.routes.js.map