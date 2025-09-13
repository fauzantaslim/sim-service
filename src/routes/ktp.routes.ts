import { Router } from 'express';
import { KTPController } from '../controllers/ktp.controller';

const router = Router();
const ktpController = new KTPController();

/**
 * PRIVATE ROUTES - Semua endpoint KTP memerlukan autentikasi
 * Middleware deserializeToken akan diterapkan di index.ts untuk semua private routes
 */

/**
 * Routes untuk operasi CRUD KTP
 */
router.post('/', ktpController.createKTP);
router.get('/', ktpController.getKTPs);
router.get('/:ktpId', ktpController.getKTPById);
router.put('/:ktpId', ktpController.updateKTP);
router.delete('/:ktpId', ktpController.deleteKTP);

export default router;
