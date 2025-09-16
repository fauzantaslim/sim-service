import { Application, Router } from 'express';
import { deserializeToken } from '../middlewares/auth.middleware';
import { AuthController } from '../controllers/auth.controller';

import userRoutes from './user.routes';
import simRoutes from './sim.routes';

export const registerRoutes = (app: Application): void => {
  const publicRouter = Router();
  const privateRouter = Router();
  const authController = new AuthController();

  // Public routes
  publicRouter.post('/auth/login', authController.login);
  publicRouter.post('/auth/refresh', authController.refreshToken);

  // Private routes middleware
  privateRouter.use(deserializeToken);

  // Register private routes
  privateRouter.post('/auth/logout', authController.logout);
  privateRouter.get('/auth/me', authController.me);
  privateRouter.use('/users', userRoutes);
  privateRouter.use('/sim', simRoutes);

  app.use('/api', publicRouter);
  app.use('/api', privateRouter);
};
