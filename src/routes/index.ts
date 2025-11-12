import { Application, Router } from 'express';
import { deserializeToken } from '../middlewares/auth.middleware';

// Impor semua rute modular
import authUserRoutes from './authUser.routes';
import authAdminRoutes from './authAdmin.routes';

import simRoutes from './sim.routes';
import satpasRoutes from './satpas.routes';
import adminRoutes from './admin.routes';
import pendaftaranSIMRoutes from './pendaftaranSIM.routes';

export const registerRoutes = (app: Application): void => {
  const apiRouter = Router();

  // Daftarkan setiap modul rute di bawah prefiks yang sesuai
  apiRouter.use('/auth/users', authUserRoutes);
  apiRouter.use('/auth/admin', authAdminRoutes);

  // Private routes - memerlukan autentikasi
  apiRouter.use('/sim', deserializeToken, simRoutes);
  apiRouter.use('/satpas', deserializeToken, satpasRoutes);
  apiRouter.use('/admin', deserializeToken, adminRoutes);
  apiRouter.use('/pendaftaran', deserializeToken, pendaftaranSIMRoutes);

  // Pasang semua rute di bawah prefiks /api
  app.use('/api', apiRouter);
};
