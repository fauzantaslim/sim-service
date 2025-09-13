import { Response, NextFunction } from 'express';
import { KTPService } from '../services/ktp.service';
import { UserRequest } from '../types/request.type';
import { KTPPaginationParams } from '../types/pagination.type';
import {
  CreateKTPRequest,
  UpdateKTPRequest,
  GetKTPRequest,
  DeleteKTPRequest
} from '../types/ktp.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';

/**
 * Controller untuk menangani request terkait KTP.
 */
export class KTPController {
  private ktpService: KTPService;

  constructor() {
    this.ktpService = new KTPService();
  }

  /**
   * Helper method untuk validasi field sorting
   */
  private validateSortField(sortBy: string): string {
    const allowedSortFields = new Set([
      'nik',
      'tempat_lahir',
      'tanggal_lahir',
      'jenis_kelamin',
      'agama',
      'status_perkawinan',
      'gol_darah',
      'pekerjaan',
      'creator_name',
      'created_at',
      'updated_at'
    ]);

    return allowedSortFields.has(sortBy) ? sortBy : 'created_at';
  }

  /**
   * Membuat KTP baru.
   * POST /ktp
   */
  createKTP = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      const request: CreateKTPRequest = req.body as CreateKTPRequest;
      const newKTP = await this.ktpService.createKTP(request, req.user.user_id);

      res.status(StatusCodes.CREATED).json({
        success: true,
        status_code: StatusCodes.CREATED,
        message: 'KTP berhasil dibuat',
        data: newKTP
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil daftar KTP dengan pagination dan filter.
   * GET /ktp
   */
  getKTPs = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const sortBy = req.query.sort_by as string;
      const validSortBy = this.validateSortField(sortBy);

      // Validasi query parameters termasuk filter enum
      const paginationParams: KTPPaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sort_by: validSortBy,
        sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc',
        jenis_kelamin: req.query.jenis_kelamin as string,
        agama: req.query.agama as string,
        status_perkawinan: req.query.status_perkawinan as string,
        gol_darah: req.query.gol_darah as string
      };

      const result = await this.ktpService.getKTPs(paginationParams);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Daftar KTP berhasil diambil',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mengambil detail KTP berdasarkan ID.
   * GET /ktp/:ktpId
   */
  getKTPById = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const request: GetKTPRequest = {
        ktp_id: req.params.ktpId
      };

      const ktp = await this.ktpService.getKTPById(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'Detail KTP berhasil diambil',
        data: ktp
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Memperbarui data KTP.
   * PUT /ktp/:ktpId
   */
  updateKTP = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const request: UpdateKTPRequest = {
        ...req.body,
        ktp_id: req.params.ktpId
      };
      const updatedKTP = await this.ktpService.updateKTP(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'KTP berhasil diperbarui',
        data: updatedKTP
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Menghapus KTP.
   * DELETE /ktp/:ktpId
   */
  deleteKTP = async (req: UserRequest, res: Response, next: NextFunction) => {
    try {
      const request: DeleteKTPRequest = {
        ktp_id: req.params.ktpId
      };
      await this.ktpService.deleteKTP(request);

      res.status(StatusCodes.OK).json({
        success: true,
        status_code: StatusCodes.OK,
        message: 'KTP berhasil dihapus'
      });
    } catch (error) {
      next(error);
    }
  };
}
