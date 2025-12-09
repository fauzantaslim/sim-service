import { Response, NextFunction, Request } from 'express';
import { AuthUserService } from '../services/authUser.service';
import { AuthRequest } from '../types/request.type';
import { AuthUserValidation } from '../validations/authUser.validation';
import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger';

/**
 * Controller untuk menangani request terkait autentikasi pengguna.
 */
export class AuthUserController {
  private authUserService: AuthUserService;

  constructor() {
    this.authUserService = new AuthUserService();
  }

  /**
   * Memulai proses registrasi user.
   * POST /auth/users/register
   */
  registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedRequest = AuthUserValidation.REGISTER.parse(req.body);
      const result = await this.authUserService.registerUser(validatedRequest);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: result.message,
        data: {
          has_pin: result.has_pin,
          requires_otp: result.requires_otp
        }
      });
    } catch (error) {
      logger.error({
        endpoint: 'POST /auth/users/register',
        phone_number: req.body?.phone_number,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Register request failed'
      });
      next(error);
    }
  };

  /**
   * Verifikasi OTP.
   * POST /auth/users/verify-otp
   */
  verifyOTP = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedRequest = AuthUserValidation.VERIFY_OTP.parse(req.body);
      const result = await this.authUserService.verifyOTP(validatedRequest);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: result.message,
        data: {
          user_id: result.user_id
        }
      });
    } catch (error) {
      logger.error({
        endpoint: 'POST /auth/users/verify-otp',
        phone_number: req.body?.phone_number,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'OTP verification failed'
      });
      next(error);
    }
  };

  /**
   * Set PIN setelah OTP terverifikasi.
   * PATCH /auth/users/set-pin
   */
  setPIN = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedRequest = AuthUserValidation.SET_PIN.parse(req.body);

      const result = await this.authUserService.setPIN(
        validatedRequest,
        req.get('User-Agent'),
        req.ip,
        req,
        res
      );

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'PIN berhasil di-set',
        data: result
      });
    } catch (error) {
      logger.error({
        endpoint: 'PATCH /auth/users/set-pin',
        user_id: req.body?.user_id,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Set PIN failed'
      });
      next(error);
    }
  };

  /**
   * Melakukan login user.
   * POST /auth/users/login
   */
  loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedRequest = AuthUserValidation.LOGIN.parse(req.body);
      const userAgent = req.get('User-Agent');
      const ipAddress = req.ip;

      const result = await this.authUserService.loginUser(
        validatedRequest,
        userAgent,
        ipAddress,
        req,
        res
      );

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Login berhasil',
        data: result
      });
    } catch (error) {
      logger.error({
        endpoint: 'POST /auth/user/login',
        phone_number: req.body?.phone_number,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Login request failed'
      });
      next(error);
    }
  };

  /**
   * Melakukan logout user.
   * POST /auth/user/logout
   */
  logoutUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { auth } = req;
      if (auth?.role !== 'user') {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: 'Akses ditolak atau token tidak valid' });
      }

      const result = await this.authUserService.logoutUser(auth.user_id);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: result.message
      });
    } catch (error) {
      const userId = req.auth?.role === 'user' ? req.auth.user_id : undefined;
      logger.error({
        endpoint: 'POST /auth/user/logout',
        user_id: userId,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Logout request failed'
      });
      next(error);
    }
  };

  /**
   * Refresh access token untuk user menggunakan refresh token dari HTTP-only cookie.
   * POST /auth/users/refresh
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refresh_token;
      if (!refreshToken) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          status_code: StatusCodes.BAD_REQUEST,
          message: 'Refresh token tidak ditemukan',
          data: null
        });
      }

      const result = await this.authUserService.refreshToken(
        refreshToken,
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
        endpoint: 'POST /auth/user/refresh',
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Refresh token request failed'
      });
      next(error);
    }
  };

  /**
   * Mengambil data user yang sedang login.
   * GET /auth/user/me
   */
  getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { auth } = req;
      if (auth?.role !== 'user') {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: 'Akses ditolak atau token tidak valid' });
      }

      const user = await this.authUserService.getMe(auth.user_id);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Data user berhasil diambil',
        data: user
      });
    } catch (error) {
      const userId = req.auth?.role === 'user' ? req.auth.user_id : undefined;
      logger.error({
        endpoint: 'GET /auth/user/me',
        user_id: userId,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Get user profile request failed'
      });
      next(error);
    }
  };
  verifyNIK = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { auth } = req;
      if (auth?.role !== 'user') {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: 'Akses ditolak atau token tidak valid' });
      }

      const { nik } = AuthUserValidation.VERIFY_NIK.parse(req.body);
      const result = await this.authUserService.verifyNIK(auth.user_id, nik);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: result.message,
        data: result.user
      });
    } catch (error) {
      const userId = req.auth?.role === 'user' ? req.auth.user_id : undefined;
      logger.error({
        endpoint: 'PUT /auth/users/verify-nik',
        user_id: userId,
        ip: req.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'NIK verification request failed'
      });
      next(error);
    }
  };
}
