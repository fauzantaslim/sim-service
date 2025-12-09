import { Response, NextFunction } from 'express';
import { SIMService } from '../services/sim.service';
import { AuthRequest } from '../types/request.type';
import { PaginationParams } from '../types/pagination.type';
import {
  CreateSIMRequest,
  UpdateSIMRequest,
  GetSIMRequest
} from '../types/sim.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import { isValidImageFile } from '../utils/imageUpload';
import fileUpload from 'express-fileupload';

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
      'tanggal_terbit',
      'tanggal_expired',
      'creator_name',
      'created_at',
      'updated_at'
    ]);

    return allowedSortFields.has(sortBy) ? sortBy : 'created_at';
  }

  /**
   * Membuat SIM baru dengan upload foto.
   * POST /sim
   * Admin only
   */
  createSIM = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      // Hanya admin yang bisa membuat SIM
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat membuat SIM'
        );
      }

      // Check if file uploaded
      if (!req.files || !req.files.picture) {
        throw new ResponseError(
          StatusCodes.BAD_REQUEST,
          'Foto SIM harus diupload'
        );
      }

      // Get the file from express-fileupload
      const file = req.files.picture as fileUpload.UploadedFile;

      // Validate file type
      if (!isValidImageFile(file)) {
        throw new ResponseError(
          StatusCodes.BAD_REQUEST,
          'Format file tidak valid. Hanya JPG, JPEG, PNG, dan WEBP yang diperbolehkan.'
        );
      }

      const request: CreateSIMRequest = {
        pendaftaran_id: req.body.pendaftaran_id,
        tanggal_terbit: req.body.tanggal_terbit,
        tanggal_expired: req.body.tanggal_expired
      };

      const newSIM = await this.simService.createSIM(
        request,
        file.data,
        req.auth.admin_id.toString()
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
   * Mengambil daftar SIM dengan pagination.
   * GET /sim
   * Admin only
   */
  getSIMs = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      // Hanya admin yang bisa melihat daftar SIM
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat melihat daftar SIM'
        );
      }

      const sortBy = req.query.sort_by as string;
      const validSortBy = this.validateSortField(sortBy);

      const paginationParams: PaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        sort_by: validSortBy,
        sort_order: (req.query.sort_order as 'asc' | 'desc') || 'desc'
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
   * Admin only
   */
  getSIMById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      // Hanya admin yang bisa melihat detail SIM
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat melihat detail SIM'
        );
      }

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
   * Memperbarui data SIM (tanggal expired dan/atau foto).
   * PATCH /sim/:simId
   * Admin only
   */
  updateSIM = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      // Hanya admin yang bisa update SIM
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat memperbarui SIM'
        );
      }

      // Validate file type if file is uploaded
      let fileBuffer: Buffer | undefined;
      if (req.files && req.files.picture) {
        const file = req.files.picture as fileUpload.UploadedFile;

        if (!isValidImageFile(file)) {
          throw new ResponseError(
            StatusCodes.BAD_REQUEST,
            'Format file tidak valid. Hanya JPG, JPEG, PNG, dan WEBP yang diperbolehkan.'
          );
        }

        fileBuffer = file.data;
      }

      const request: UpdateSIMRequest = {
        sim_id: req.params.simId,
        tanggal_expired: req.body.tanggal_expired
      };

      const updatedSIM = await this.simService.updateSIM(request, fileBuffer);

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
   * Admin only
   */
  deleteSIM = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'User tidak terautentikasi'
        );
      }

      // Hanya admin yang bisa delete SIM
      if (req.auth.role !== 'admin') {
        throw new ResponseError(
          StatusCodes.FORBIDDEN,
          'Hanya admin yang dapat menghapus SIM'
        );
      }

      const request: GetSIMRequest = {
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
