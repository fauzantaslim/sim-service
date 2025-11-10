import { Response, NextFunction } from 'express';
import { SatpasService } from '../services/satpas.service';
import { AuthRequest } from '../types/request.type';
import { PaginationParams } from '../types/pagination.type';
import {
  CreateSatpasRequest,
  UpdateSatpasRequest,
  GetSatpasRequest,
  DeleteSatpasRequest
} from '../types/satpas.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';

/**
 * Controller untuk menangani request terkait Satpas.
 */
export class SatpasController {
  private satpasService: SatpasService;

  constructor() {
    this.satpasService = new SatpasService();
  }

  /**
   * Helper method untuk validasi field sorting
   */
  private validateSortField(sortBy: string): string {
    const allowedSortFields = new Set([
      'name',
      'latitude',
      'longitude',
      'created_at',
      'updated_at'
    ]);

    return allowedSortFields.has(sortBy) ? sortBy : 'created_at';
  }

  /**
   * Membuat Satpas baru.
   * POST /satpas
   */
  createSatpas = async (
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

      // Hanya admin yang bisa membuat Satpas
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat membuat Satpas'
        );
      }

      const request: CreateSatpasRequest = req.body as CreateSatpasRequest;
      const newSatpas = await this.satpasService.createSatpas(request);

      res.status(StatusCodes.CREATED).json({
        success: true,
        status_code: StatusCodes.CREATED,
        message: 'Satpas berhasil dibuat',
        data: newSatpas
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil daftar Satpas dengan pagination dan filter.
   * GET /satpas
   */
  getSatpasList = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
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

      const result = await this.satpasService.getSatpasList(paginationParams);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Daftar Satpas berhasil diambil',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil detail Satpas berdasarkan ID.
   * GET /satpas/:satpasId
   */
  getSatpasById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const request: GetSatpasRequest = {
        satpas_id: req.params.satpasId
      };

      const satpas = await this.satpasService.getSatpasById(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Detail Satpas berhasil diambil',
        data: satpas
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Memperbarui data Satpas.
   * PUT /satpas/:satpasId
   */
  updateSatpas = async (
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

      // Hanya admin yang bisa update Satpas
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat memperbarui Satpas'
        );
      }

      const request: UpdateSatpasRequest = {
        ...req.body,
        satpas_id: req.params.satpasId
      };
      const updatedSatpas = await this.satpasService.updateSatpas(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Satpas berhasil diperbarui',
        data: updatedSatpas
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Menghapus Satpas.
   * DELETE /satpas/:satpasId
   */
  deleteSatpas = async (
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

      // Hanya admin yang bisa delete Satpas
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat menghapus Satpas'
        );
      }

      const request: DeleteSatpasRequest = {
        satpas_id: req.params.satpasId
      };
      await this.satpasService.deleteSatpas(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Satpas berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  };
}
