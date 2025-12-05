import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller.js';

const router = Router();


router.post('/register', AuthController.register);
router.post('/login', AuthController.login);


router.get('/shopify', AuthController.install); 
router.get('/callback', AuthController.callback);

export default router;