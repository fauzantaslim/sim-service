import { Response, NextFunction, Request } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRequest } from '../types/request.type';
import { LoginRequest } from '../types/user.type';
import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger';

/**
 * Controller untuk menangani request terkait autentikasi.
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Melakukan login user.
   * POST /auth/login
   */
  login = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const request: LoginRequest = req.body as LoginRequest;

      // Ambil user_agent dan ip_address dari request headers
      const user_agent = req.get('User-Agent') || undefined;
      const ip_address = req.ip || req.connection.remoteAddress || undefined;

      const result = await this.authService.login(
        request,
        user_agent,
        ip_address,
        req,
        res
      );

      // Debug log untuk melihat response yang akan dikirim
      logger.info({
        endpoint: 'POST /auth/login',
        email: request.email,
        ip: req.ip,
        response_data: result,
        message: 'Login response prepared'
      });

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Login berhasil',
        data: result
      });
    } catch (error) {
      logger.error({
        endpoint: 'POST /auth/login',
        email: req.body?.email,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Login request failed'
      });
      next(error);
    }
  };

  /**
   * Melakukan logout user.
   * POST /auth/logout
   */
  logout = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        logger.warn({
          endpoint: 'POST /auth/logout',
          ip: req.ip,
          message: 'Logout failed: User not authenticated'
        });
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          status_code: StatusCodes.UNAUTHORIZED,
          message: 'User tidak terautentikasi'
        });
      }

      const result = await this.authService.logout(req.user.user_id.toString());

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: result.message
      });
    } catch (error) {
      logger.error({
        endpoint: 'POST /auth/logout',
        user_id: req.user?.user_id,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Logout request failed'
      });
      next(error);
    }
  };

  /**
   * Refresh access token menggunakan refresh token dari cookie.
   * POST /auth/refresh
   */
  refreshToken = async (
    req: UserRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { cookies } = req as Request & {
        cookies?: Record<string, string>;
      };
      const refresh_token = cookies?.refresh_token as string | undefined;

      if (!refresh_token) {
        logger.warn({
          endpoint: 'POST /auth/refresh',
          ip: req.ip,
          message: 'Refresh token failed: No refresh token found'
        });
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          status_code: StatusCodes.BAD_REQUEST,
          message: 'Refresh token tidak ditemukan',
          data: null
        });
      }

      const result = await this.authService.refreshToken(
        refresh_token,
        req,
        res
      );

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Token berhasil di-refresh',
        data: result
      });
    } catch (error) {
      logger.error({
        endpoint: 'POST /auth/refresh',
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Refresh token request failed'
      });
      next(error);
    }
  };

  /**
   * Memvalidasi token dan mengembalikan data user yang sedang login.
   * GET /auth/me
   */
  me = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        logger.warn({
          endpoint: 'GET /auth/me',
          ip: req.ip,
          message: 'Get user profile failed: User not authenticated'
        });
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          status_code: StatusCodes.UNAUTHORIZED,
          message: 'User tidak terautentikasi',
          data: null
        });
      }

      const user = await this.authService.validateToken(
        req.user.user_id.toString()
      );

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Data user berhasil diambil',
        data: user
      });
    } catch (error) {
      logger.error({
        endpoint: 'GET /auth/me',
        user_id: req.user?.user_id,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Get user profile request failed'
      });
      next(error);
    }
  };
}
