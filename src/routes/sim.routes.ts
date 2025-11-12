import { Router } from 'express';
import { SIMController } from '../controllers/sim.controller';
import { uploadSingle } from '../utils/imageUpload';

const router = Router();
const simController = new SIMController();

/**
 * PRIVATE ROUTES - Semua endpoint SIM memerlukan autentikasi
 * Middleware deserializeToken akan diterapkan di index.ts untuk semua private routes
 * ADMIN ONLY - Hanya admin yang bisa mengakses endpoint SIM
 */

/**
 * Routes untuk operasi CRUD SIM
 */
router.post('/', uploadSingle, simController.createSIM);
router.get('/', simController.getSIMs);
router.get('/:simId', simController.getSIMById);
router.patch('/:simId', uploadSingle, simController.updateSIM);
router.delete('/:simId', simController.deleteSIM);

export default router;
