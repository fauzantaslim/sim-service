import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

/**
 * PUBLIC ROUTES - Tidak memerlukan autentikasi
 */
router.get('/csrf-token', authController.getCsrfToken);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

/**
 * PRIVATE ROUTES - Memerlukan autentikasi
 * Middleware deserializeToken akan diterapkan di index.ts untuk semua private routes
 */
router.post('/logout', authController.logout);
router.get('/me', authController.me);

export default router;
