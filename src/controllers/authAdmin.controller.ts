import { Response, NextFunction, Request } from 'express';
import { AuthAdminService } from '../services/authAdmin.service';
import { AuthRequest } from '../types/request.type';
import { AuthAdminValidation } from '../validations/authAdmin.validation';
import { StatusCodes } from 'http-status-codes';

export class AuthAdminController {
  private authService: AuthAdminService;

  constructor() {
    this.authService = new AuthAdminService();
  }

  loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedRequest = AuthAdminValidation.LOGIN.parse(req.body);
      const user_agent = req.get('User-Agent') || undefined;
      const ip_address = req.ip || req.connection.remoteAddress || undefined;

      const result = await this.authService.loginAdmin(
        validatedRequest,
        user_agent,
        ip_address,
        req,
        res
      );

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Login admin berhasil',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  logoutAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { auth } = req;
      if (auth?.role !== 'admin') {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: 'Akses ditolak atau token tidak valid' });
      }

      const result = await this.authService.logoutAdmin(auth.admin_id);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  refreshTokenAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { cookies } = req as Request & { cookies?: Record<string, string> };
      const refresh_token = cookies?.refresh_token as string | undefined;
      if (!refresh_token) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          status_code: StatusCodes.BAD_REQUEST,
          message: 'Refresh token tidak ditemukan',
          data: null
        });
      }

      const result = await this.authService.refreshTokenAdmin(
        refresh_token,
        req,
        res
      );

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Token admin berhasil di-refresh',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { auth } = req;
      if (auth?.role !== 'admin') {
        return res
          .status(StatusCodes.FORBIDDEN)
          .json({ message: 'Akses ditolak atau token tidak valid' });
      }
      const admin = await this.authService.getMe(auth.admin_id);
      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Data admin berhasil diambil',
        data: admin
      });
    } catch (error) {
      next(error);
    }
  };
}
