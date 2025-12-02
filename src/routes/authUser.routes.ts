import { Router } from 'express';
import { AuthUserController } from '../controllers/authUser.Controller';
import { deserializeToken } from '../middlewares/auth.middleware';

const router = Router();
const authUserController = new AuthUserController();

// Endpoint publik
router.post('/register', authUserController.registerUser);
router.post('/verify-otp', authUserController.verifyOTP);
router.patch('/set-pin', authUserController.setPIN);
router.post('/login', authUserController.loginUser);
router.post('/refresh', authUserController.refreshToken);

// Endpoint yang memerlukan autentikasi
router.post('/logout', deserializeToken, authUserController.logoutUser);
router.get('/me', deserializeToken, authUserController.getMe);
router.put('/verify-nik', deserializeToken, authUserController.verifyNIK);

export default router;
