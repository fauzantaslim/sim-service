import { Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service';
import { AuthRequest } from '../types/request.type';
import { PaginationParams } from '../types/pagination.type';
import {
  CreateAdminRequest,
  UpdateAdminRequest,
  GetAdminRequest,
  DeleteAdminRequest
} from '../types/admin.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';

/**
 * Controller untuk menangani request terkait Admin CRUD.
 */
export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  /**
   * Helper method untuk validasi field sorting
   */
  private validateSortField(sortBy: string): string {
    const allowedSortFields = new Set([
      'email',
      'full_name',
      'created_at',
      'updated_at'
    ]);

    return allowedSortFields.has(sortBy) ? sortBy : 'created_at';
  }

  /**
   * Membuat Admin baru.
   * POST /admin
   */
  createAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      // Hanya admin yang bisa membuat Admin baru
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat membuat Admin baru'
        );
      }

      const request: CreateAdminRequest = req.body as CreateAdminRequest;
      const newAdmin = await this.adminService.createAdmin(request);

      res.status(StatusCodes.CREATED).json({
        success: true,
        status_code: StatusCodes.CREATED,
        message: 'Admin berhasil dibuat',
        data: newAdmin
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil daftar Admin dengan pagination dan filter.
   * GET /admin
   */
  getAdminList = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      // Hanya admin yang bisa melihat daftar Admin
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat melihat daftar Admin'
        );
      }

      const sortBy = req.query.sort_by as string;
      const validSortBy = this.validateSortField(sortBy);

      // Validasi query parameters
      const paginationParams: PaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sort_by: validSortBy,
        sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc'
      };

      const result = await this.adminService.getAdminList(paginationParams);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Daftar Admin berhasil diambil',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil detail Admin berdasarkan ID.
   * GET /admin/:adminId
   */
  getAdminById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.auth) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      // Hanya admin yang bisa melihat detail Admin
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat melihat detail Admin'
        );
      }

      const request: GetAdminRequest = {
        admin_id: req.params.adminId
      };

      const admin = await this.adminService.getAdminById(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Detail Admin berhasil diambil',
        data: admin
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Memperbarui data Admin.
   * PUT /admin/:adminId
   */
  updateAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      // Hanya admin yang bisa update Admin
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat memperbarui Admin'
        );
      }

      const request: UpdateAdminRequest = {
        ...req.body,
        admin_id: req.params.adminId
      };
      const updatedAdmin = await this.adminService.updateAdmin(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Admin berhasil diperbarui',
        data: updatedAdmin
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Menghapus Admin.
   * DELETE /admin/:adminId
   */
  deleteAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      // Hanya admin yang bisa delete Admin
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat menghapus Admin'
        );
      }

      const request: DeleteAdminRequest = {
        admin_id: req.params.adminId
      };
      await this.adminService.deleteAdmin(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Admin berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  };
}
