import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

router.post('/login', AuthController.login);
router.post('/recover-password', AuthController.requestPasswordRecovery);
router.post('/reset-password', AuthController.resetPassword);
router.get('/verify', AuthController.verifyToken);

export default router;