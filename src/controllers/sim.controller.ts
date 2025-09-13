import { Response, NextFunction } from 'express';
import { SIMService } from '../services/sim.service';
import { UserRequest } from '../types/request.type';
import { SIMPaginationParams } from '../types/pagination.type';
import {
  CreateSIMRequest,
  UpdateSIMRequest,
  GetSIMRequest,
  DeleteSIMRequest
} from '../types/sim.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';

/**
 * Controller untuk menangani request terkait SIM.
 */
export class SIMController {
  private simService: SIMService;

  constructor() {
    this.simService = new SIMService();
  }

  /**
   * Helper method untuk validasi field sorting
   */
  private validateSortField(sortBy: string): string {
    const allowedSortFields = new Set([
      'nomor_sim',
      'jenis_sim',
      'tanggal_terbit',
      'tanggal_expired',
      'creator_name',
      'created_at',
      'updated_at'
    ]);

    return allowedSortFields.has(sortBy) ? sortBy : 'created_at';
  }

  /**
   * Membuat SIM baru.
   * POST /sim
   */
  createSIM = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      const request: CreateSIMRequest = req.body as CreateSIMRequest;
      const newSIM = await this.simService.createSIM(
        request,
        req.user.user_id.toString()
      );

      res.status(StatusCodes.CREATED).json({
        success: true,
        status_code: StatusCodes.CREATED,
        message: 'SIM berhasil dibuat',
        data: newSIM
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil daftar SIM dengan pagination dan filter.
   * GET /sim
   */
  getSIMs = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const sortBy = req.query.sort_by as string;
      const validSortBy = this.validateSortField(sortBy);

      // Validasi query parameters termasuk filter enum
      const paginationParams: SIMPaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sort_by: validSortBy,
        sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc',
        jenis_sim: req.query.jenis_sim as string
      };

      const result = await this.simService.getSIMs(paginationParams);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Daftar SIM berhasil diambil',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil detail SIM berdasarkan ID.
   * GET /sim/:simId
   */
  getSIMById = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const request: GetSIMRequest = {
        sim_id: req.params.simId
      };

      const sim = await this.simService.getSIMById(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Detail SIM berhasil diambil',
        data: sim
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Memperbarui data SIM.
   * PUT /sim/:simId
   */
  updateSIM = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const request: UpdateSIMRequest = {
        ...req.body,
        sim_id: req.params.simId
      };
      const updatedSIM = await this.simService.updateSIM(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'SIM berhasil diperbarui',
        data: updatedSIM
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Menghapus SIM.
   * DELETE /sim/:simId
   */
  deleteSIM = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const request: DeleteSIMRequest = {
        sim_id: req.params.simId
      };
      await this.simService.deleteSIM(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'SIM berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  };
}
