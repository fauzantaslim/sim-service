import { Router } from 'express';
import { AuthAdminController } from '../controllers/authAdmin.controller';
import { deserializeToken } from '../middlewares/auth.middleware';

const router = Router();
const authController = new AuthAdminController();

// PUBLIC
router.post('/login', authController.loginAdmin);
router.post('/refresh', authController.refreshTokenAdmin);

// PRIVATE (middleware auth dipasang di index.ts)
router.post('/logout', deserializeToken, authController.logoutAdmin);
router.get('/me', deserializeToken, authController.getMe);

export default router;
