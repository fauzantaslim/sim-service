import { SatpasRepository } from '../repositories/satpas.repository';
import { Satpas } from '../models/satpas.model';
import { PaginationParams, PaginationResponse } from '../types/pagination.type';
import {
  SatpasResponse,
  CreateSatpasRequest,
  UpdateSatpasRequest,
  GetSatpasRequest,
  DeleteSatpasRequest
} from '../types/satpas.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import { SatpasValidation } from '../validations/satpas.validation';
import { Validation } from '../validations/validatiom';
import logger from '../utils/logger';

/**
 * Service untuk operasi bisnis terkait Satpas.
 */
export class SatpasService {
  private satpasRepository: SatpasRepository;

  constructor() {
    this.satpasRepository = new SatpasRepository();
  }

  /**
   * Membuat Satpas baru.
   */
  async createSatpas(satpasData: CreateSatpasRequest): Promise<SatpasResponse> {
    logger.info({
      name: satpasData.name,
      message: 'Create Satpas attempt started'
    });

    // Validasi input menggunakan Validation utility
    const validatedData = Validation.validate(
      SatpasValidation.CREATE,
      satpasData
    );

    // Validasi nama Satpas sudah ada
    const nameExists = await this.satpasRepository.isNameExists(
      validatedData.name
    );
    if (nameExists) {
      logger.warn({
        name: validatedData.name,
        message: 'Create Satpas failed: Name already exists'
      });
      throw new ResponseError(
        StatusCodes.CONFLICT,
        `Satpas dengan nama "${validatedData.name}" sudah ada`
      );
    }

    // Buat Satpas data untuk database
    const satpasToCreate: Omit<
      Satpas,
      'satpas_id' | 'created_at' | 'updated_at'
    > = {
      name: validatedData.name,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude
    };

    const result = await this.satpasRepository.create(satpasToCreate);

    logger.info({
      satpas_id: result.satpas_id,
      name: result.name,
      message: 'Create Satpas successful'
    });

    return result;
  }

  /**
   * Mengambil daftar Satpas dengan pagination.
   */
  async getSatpasList(
    params: PaginationParams
  ): Promise<PaginationResponse<SatpasResponse>> {
    logger.info({
      page: params.page,
      limit: params.limit,
      search: params.search,
      message: 'Get Satpas list attempt started'
    });

    // Validasi parameter pagination
    if (params.page < 1) {
      logger.warn({
        page: params.page,
        message: 'Get Satpas failed: Invalid page number'
      });
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Halaman harus lebih dari 0'
      );
    }

    if (params.limit < 1 || params.limit > 100) {
      logger.warn({
        limit: params.limit,
        message: 'Get Satpas failed: Invalid limit'
      });
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Limit harus antara 1-100'
      );
    }

    const result = await this.satpasRepository.findAll(params);

    logger.info({
      page: params.page,
      limit: params.limit,
      total_items: result.pagination.total_items,
      total_pages: result.pagination.total_pages,
      message: 'Get Satpas list successful'
    });

    return result;
  }

  /**
   * Mengambil detail Satpas berdasarkan ID.
   */
  async getSatpasById(request: GetSatpasRequest): Promise<SatpasResponse> {
    logger.info({
      satpas_id: request.satpas_id,
      message: 'Get Satpas by ID attempt started'
    });

    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(SatpasValidation.GET, request);

    const satpas = await this.satpasRepository.findById(
      validatedParams.satpas_id
    );

    if (!satpas) {
      logger.warn({
        satpas_id: validatedParams.satpas_id,
        message: 'Get Satpas by ID failed: Satpas not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'Satpas tidak ditemukan');
    }

    logger.info({
      satpas_id: satpas.satpas_id,
      name: satpas.name,
      message: 'Get Satpas by ID successful'
    });

    return satpas;
  }

  /**
   * Memperbarui data Satpas.
   */
  async updateSatpas(request: UpdateSatpasRequest): Promise<SatpasResponse> {
    logger.info({
      satpas_id: request.satpas_id,
      message: 'Update Satpas attempt started'
    });

    // Validasi parameter dan data menggunakan Validation utility
    const validatedData = Validation.validate(SatpasValidation.UPDATE, request);

    // Cek Satpas ada atau tidak
    const existingSatpas = await this.satpasRepository.findById(
      validatedData.satpas_id
    );
    if (!existingSatpas) {
      logger.warn({
        satpas_id: validatedData.satpas_id,
        message: 'Update Satpas failed: Satpas not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'Satpas tidak ditemukan');
    }

    // Validasi nama Satpas jika diupdate
    if (validatedData.name && validatedData.name !== existingSatpas.name) {
      const nameExists = await this.satpasRepository.isNameExists(
        validatedData.name,
        validatedData.satpas_id
      );
      if (nameExists) {
        logger.warn({
          satpas_id: validatedData.satpas_id,
          name: validatedData.name,
          message: 'Update Satpas failed: Name already exists'
        });
        throw new ResponseError(
          StatusCodes.CONFLICT,
          `Satpas dengan nama "${validatedData.name}" sudah ada`
        );
      }
    }

    // Hapus satpas_id dari update data karena tidak boleh diupdate
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { satpas_id: _satpas_id, ...dataToUpdate } = validatedData as Partial<
      Omit<Satpas, 'satpas_id' | 'created_at'>
    > & { satpas_id?: string };

    const updatedSatpas = await this.satpasRepository.update(
      validatedData.satpas_id,
      dataToUpdate
    );
    if (!updatedSatpas) {
      logger.error({
        satpas_id: validatedData.satpas_id,
        message: 'Update Satpas failed: Database update failed'
      });
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal memperbarui Satpas'
      );
    }

    logger.info({
      satpas_id: updatedSatpas.satpas_id,
      name: updatedSatpas.name,
      message: 'Update Satpas successful'
    });

    return updatedSatpas;
  }

  /**
   * Menghapus Satpas.
   */
  async deleteSatpas(request: DeleteSatpasRequest): Promise<void> {
    logger.info({
      satpas_id: request.satpas_id,
      message: 'Delete Satpas attempt started'
    });

    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(
      SatpasValidation.DELETE,
      request
    );

    const satpasExists = await this.satpasRepository.findById(
      validatedParams.satpas_id
    );
    if (!satpasExists) {
      logger.warn({
        satpas_id: validatedParams.satpas_id,
        message: 'Delete Satpas failed: Satpas not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'Satpas tidak ditemukan');
    }

    const deleted = await this.satpasRepository.delete(
      validatedParams.satpas_id
    );
    if (!deleted) {
      logger.error({
        satpas_id: validatedParams.satpas_id,
        message: 'Delete Satpas failed: Database delete failed'
      });
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal menghapus Satpas'
      );
    }

    logger.info({
      satpas_id: validatedParams.satpas_id,
      name: satpasExists.name,
      message: 'Delete Satpas successful'
    });
  }
}
