import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { deserializeToken } from '../middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

/**
 * PRIVATE ROUTES - Semua endpoint user memerlukan autentikasi
 * Menggunakan middleware auth untuk semua route di bawah ini
 */
router.use(deserializeToken);

/**
 * Routes untuk operasi CRUD user (semua private)
 */
router.post('/', userController.createUser);
router.get('/', userController.getUsers);
router.get('/:userId', userController.getUserById);
router.put('/:userId', userController.updateUser);
router.delete('/:userId', userController.deleteUser);

export default router;
