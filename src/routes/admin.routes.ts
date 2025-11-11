import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller';

const router = Router();
const adminController = new AdminController();

/**
 * PRIVATE ROUTES - Semua endpoint Admin CRUD memerlukan autentikasi
 * Middleware deserializeToken akan diterapkan di index.ts untuk semua private routes
 * Hanya admin yang bisa mengakses endpoint ini
 */

/**
 * Routes untuk operasi CRUD Admin
 */
router.post('/', adminController.createAdmin); // Admin only
router.get('/', adminController.getAdminList); // Admin only
router.get('/:adminId', adminController.getAdminById); // Admin only
router.put('/:adminId', adminController.updateAdmin); // Admin only
router.delete('/:adminId', adminController.deleteAdmin); // Admin only

export default router;
