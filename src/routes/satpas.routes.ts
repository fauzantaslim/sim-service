import { Router } from 'express';
import { SatpasController } from '../controllers/satpas.controller';

const router = Router();
const satpasController = new SatpasController();

/**
 * PRIVATE ROUTES - Semua endpoint Satpas memerlukan autentikasi
 * Middleware deserializeToken akan diterapkan di index.ts untuk semua private routes
 */

/**
 * Routes untuk operasi CRUD Satpas
 */
router.post('/', satpasController.createSatpas); // Admin only
router.get('/', satpasController.getSatpasList); // All authenticated users
router.get('/:satpasId', satpasController.getSatpasById); // All authenticated users
router.put('/:satpasId', satpasController.updateSatpas); // Admin only
router.delete('/:satpasId', satpasController.deleteSatpas); // Admin only

export default router;
