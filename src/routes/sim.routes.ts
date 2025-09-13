import { Router } from 'express';
import { SIMController } from '../controllers/sim.controller';

const router = Router();
const simController = new SIMController();

/**
 * PRIVATE ROUTES - Semua endpoint SIM memerlukan autentikasi
 * Middleware deserializeToken akan diterapkan di index.ts untuk semua private routes
 */

/**
 * Routes untuk operasi CRUD SIM
 */
router.post('/', simController.createSIM);
router.get('/', simController.getSIMs);
router.get('/:simId', simController.getSIMById);
router.put('/:simId', simController.updateSIM);
router.delete('/:simId', simController.deleteSIM);

export default router;
