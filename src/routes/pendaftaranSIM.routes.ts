import { Router } from 'express';
import { PendaftaranSIMController } from '../controllers/pendaftaranSIM.controller';

const router = Router();
const pendaftaranController = new PendaftaranSIMController();

/**
 * PRIVATE ROUTES - Semua endpoint Pendaftaran SIM memerlukan autentikasi
 * Middleware deserializeToken akan diterapkan di index.ts
 */

/**
 * Routes untuk operasi Pendaftaran SIM
 */

// User routes
router.post('/', pendaftaranController.createPendaftaran); // User only - create pendaftaran
router.get('/me', pendaftaranController.getMyPendaftaran); // User only - get pendaftaran milik user

// Admin routes
router.get('/', pendaftaranController.getAllPendaftaran); // Admin only - get all pendaftaran

// Shared routes (with authorization check in controller)
router.get('/:pendaftaranId', pendaftaranController.getPendaftaranById); // User (own) / Admin (all)

// Admin only routes
router.patch('/:pendaftaranId/status', pendaftaranController.updateStatus); // Admin only - update status

export default router;
