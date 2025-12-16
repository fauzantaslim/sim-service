import { Response, NextFunction } from 'express';
import { PendaftaranSIMService } from '../services/pendaftaranSIM.service';
import { AuthRequest } from '../types/request.type';
import { PendaftaranSIMPaginationParams } from '../types/pagination.type';
import {
  CreatePendaftaranSIMRequest,
  UpdateStatusPendaftaranRequest,
  GetPendaftaranSIMRequest
} from '../types/pendaftaranSIM.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';

/**
 * Controller untuk menangani request terkait Pendaftaran SIM.
 */
export class PendaftaranSIMController {
  private pendaftaranService: PendaftaranSIMService;

  constructor() {
    this.pendaftaranService = new PendaftaranSIMService();
  }

  /**
   * Helper method untuk validasi field sorting
   */
  private validateSortField(sortBy: string): string {
    const allowedSortFields = new Set([
      'kode_pendaftaran',
      'tanggal_ujian',
      'status',
      'created_at',
      'updated_at'
    ]);

    return allowedSortFields.has(sortBy) ? sortBy : 'created_at';
  }

  /**
   * Membuat pendaftaran SIM baru (User role).
   * POST /pendaftaran
   */
  createPendaftaran = async (
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

      // Hanya user yang bisa membuat pendaftaran
      if (req.auth.role !== 'user') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya user yang dapat membuat pendaftaran'
        );
      }

      const request: CreatePendaftaranSIMRequest =
        req.body as CreatePendaftaranSIMRequest;
      const newPendaftaran = await this.pendaftaranService.createPendaftaran(
        req.auth.user_id,
        request
      );

      res.status(StatusCodes.CREATED).json({
        success: true,
        status_code: StatusCodes.CREATED,
        message: 'Pendaftaran SIM berhasil dibuat',
        data: newPendaftaran
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil semua pendaftaran dengan pagination (Admin only).
   * GET /pendaftaran
   */
  getAllPendaftaran = async (
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

      // Hanya admin yang bisa melihat semua pendaftaran
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat melihat semua pendaftaran'
        );
      }

      const sortBy = req.query.sort_by as string;
      const validSortBy = this.validateSortField(sortBy);

      const paginationParams: PendaftaranSIMPaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sort_by: validSortBy,
        sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc',
        status_pendaftaran: req.query.status_pendaftaran as string
      };

      const result =
        await this.pendaftaranService.getAllPendaftaran(paginationParams);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Daftar pendaftaran berhasil diambil',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil pendaftaran milik user yang sedang login (User role).
   * GET /pendaftaran/me
   */
  getMyPendaftaran = async (
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

      // Hanya user yang bisa melihat pendaftaran miliknya
      if (req.auth.role !== 'user') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya user yang dapat melihat pendaftaran miliknya'
        );
      }

      const sortBy = req.query.sort_by as string;
      const validSortBy = this.validateSortField(sortBy);

      const paginationParams: PendaftaranSIMPaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sort_by: validSortBy,
        sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc',
        status_pendaftaran: req.query.status_pendaftaran as string
      };

      const result = await this.pendaftaranService.getPendaftaranByUserId(
        req.auth.user_id,
        paginationParams
      );

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Daftar pendaftaran berhasil diambil',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil detail pendaftaran berdasarkan ID.
   * GET /pendaftaran/:pendaftaranId
   */
  getPendaftaranById = async (
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

      const request: GetPendaftaranSIMRequest = {
        pendaftaran_id: req.params.pendaftaranId
      };

      const pendaftaran =
        await this.pendaftaranService.getPendaftaranById(request);

      // User hanya bisa lihat pendaftaran miliknya sendiri
      if (
        req.auth.role === 'user' &&
        pendaftaran.user_id !== req.auth.user_id
      ) {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Anda tidak memiliki akses ke pendaftaran ini'
        );
      }

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Detail pendaftaran berhasil diambil',
        data: pendaftaran
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update status pendaftaran (Admin only).
   * PATCH /pendaftaran/:pendaftaranId/status
   */
  updateStatus = async (
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

      // Hanya admin yang bisa update status
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat mengubah status pendaftaran'
        );
      }

      const request: UpdateStatusPendaftaranRequest = {
        pendaftaran_id: req.params.pendaftaranId,
        status: req.body.status
      };

      const updatedPendaftaran =
        await this.pendaftaranService.updateStatus(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Status pendaftaran berhasil diperbarui',
        data: updatedPendaftaran
      });
    } catch (error) {
      next(error);
    }
  };
}
