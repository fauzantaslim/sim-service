import { SIMRepository } from '../repositories/sim.repository';
import { SIM } from '../models/sim.model';
import { PaginationParams, PaginationResponse } from '../types/pagination.type';
import {
  SIMResponse,
  CreateSIMRequest,
  UpdateSIMRequest,
  GetSIMRequest
} from '../types/sim.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import { SIMValidation } from '../validations/sim.validation';
import { Validation } from '../validations/validatiom';
import logger from '../utils/logger';
import { processAndSaveImage, deleteImage } from '../utils/imageUpload';
import { PendaftaranSIMRepository } from '../repositories/pendaftaranSIM.repository';

/**
 * Service untuk operasi bisnis terkait SIM.
 */
export class SIMService {
  private simRepository: SIMRepository;
  private pendaftaranRepository: PendaftaranSIMRepository;

  constructor() {
    this.simRepository = new SIMRepository();
    this.pendaftaranRepository = new PendaftaranSIMRepository();
  }

  /**
   * Membuat SIM baru dengan upload foto.
   */
  async createSIM(
    simData: CreateSIMRequest,
    pictureBuffer: Buffer,
    createdBy: string
  ): Promise<SIMResponse> {
    logger.info({
      pendaftaran_id: simData.pendaftaran_id,
      created_by: createdBy,
      message: 'Create SIM attempt started'
    });

    // Validasi input
    const validatedData = Validation.validate(SIMValidation.CREATE, simData);

    // Cek pendaftaran exists dan statusnya selesai
    const pendaftaran = await this.pendaftaranRepository.findById(
      validatedData.pendaftaran_id
    );
    if (!pendaftaran) {
      throw new ResponseError(
        StatusCodes.NOT_FOUND,
        'Pendaftaran tidak ditemukan'
      );
    }

    if (pendaftaran.status !== 'disetujui') {
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        `Pendaftaran harus berstatus disetujui. Status saat ini: ${pendaftaran.status}`
      );
    }

    // Cek apakah pendaftaran sudah punya SIM
    const hasSIM = await this.simRepository.isPendaftaranHasSIM(
      validatedData.pendaftaran_id
    );
    if (hasSIM) {
      throw new ResponseError(
        StatusCodes.CONFLICT,
        'Pendaftaran ini sudah memiliki SIM'
      );
    }

    // Process dan save image
    const picturePath = await processAndSaveImage(pictureBuffer, 'sim', 'sim');

    // Buat SIM data untuk database
    const simToCreate: Omit<
      SIM,
      'sim_id' | 'nomor_sim' | 'created_at' | 'updated_at'
    > = {
      pendaftaran_id: validatedData.pendaftaran_id,
      tanggal_terbit: new Date(validatedData.tanggal_terbit),
      tanggal_expired: new Date(validatedData.tanggal_expired),
      picture_path: picturePath,
      created_by: createdBy
    };

    const result = await this.simRepository.create(simToCreate);

    logger.info({
      sim_id: result.sim_id,
      nomor_sim: result.nomor_sim,
      pendaftaran_id: result.pendaftaran_id,
      created_by: createdBy,
      message: 'Create SIM successful'
    });

    return result;
  }

  /**
   * Mengambil daftar SIM dengan pagination.
   */
  async getSIMs(
    params: PaginationParams
  ): Promise<PaginationResponse<SIMResponse>> {
    logger.info({
      page: params.page,
      limit: params.limit,
      search: params.search,
      message: 'Get SIMs list attempt started'
    });

    // Validasi parameter pagination
    if (params.page < 1) {
      logger.warn({
        page: params.page,
        message: 'Get SIMs failed: Invalid page number'
      });
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Halaman harus lebih dari 0'
      );
    }

    if (params.limit < 1 || params.limit > 100) {
      logger.warn({
        limit: params.limit,
        message: 'Get SIMs failed: Invalid limit'
      });
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Limit harus antara 1-100'
      );
    }

    const result = await this.simRepository.findAll(params);

    logger.info({
      page: params.page,
      limit: params.limit,
      total_items: result.pagination.total_items,
      total_pages: result.pagination.total_pages,
      message: 'Get SIMs list successful'
    });

    return result;
  }

  /**
   * Mengambil detail SIM berdasarkan ID.
   */
  async getSIMById(request: GetSIMRequest): Promise<SIMResponse> {
    logger.info({
      sim_id: request.sim_id,
      message: 'Get SIM by ID attempt started'
    });

    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(SIMValidation.GET, request);

    const sim = await this.simRepository.findById(validatedParams.sim_id);

    if (!sim) {
      logger.warn({
        sim_id: validatedParams.sim_id,
        message: 'Get SIM by ID failed: SIM not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'SIM tidak ditemukan');
    }

    logger.info({
      sim_id: sim.sim_id,
      nomor_sim: sim.nomor_sim,
      message: 'Get SIM by ID successful'
    });

    return sim;
  }

  /**
   * Memperbarui data SIM (hanya tanggal expired).
   */
  async updateSIM(
    request: UpdateSIMRequest,
    pictureBuffer?: Buffer
  ): Promise<SIMResponse> {
    logger.info({
      sim_id: request.sim_id,
      message: 'Update SIM attempt started'
    });

    // Validasi parameter dan data
    const validatedData = Validation.validate(SIMValidation.UPDATE, request);

    // Cek SIM ada atau tidak
    const existingSIM = await this.simRepository.findById(validatedData.sim_id);
    if (!existingSIM) {
      logger.warn({
        sim_id: validatedData.sim_id,
        message: 'Update SIM failed: SIM not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'SIM tidak ditemukan');
    }

    // Prepare update data
    const dataToUpdate: Partial<
      Pick<SIM, 'tanggal_expired' | 'picture_path' | 'updated_at'>
    > = {};

    if (validatedData.tanggal_expired) {
      dataToUpdate.tanggal_expired = new Date(validatedData.tanggal_expired);
    }

    // Process new picture if provided
    if (pictureBuffer) {
      // Delete old picture
      if (existingSIM.picture_path) {
        await deleteImage(existingSIM.picture_path);
      }

      // Save new picture
      const newPicturePath = await processAndSaveImage(
        pictureBuffer,
        'sim',
        'sim'
      );
      dataToUpdate.picture_path = newPicturePath;
    }

    const updatedSIM = await this.simRepository.update(
      validatedData.sim_id,
      dataToUpdate
    );
    if (!updatedSIM) {
      logger.error({
        sim_id: validatedData.sim_id,
        message: 'Update SIM failed: Database update failed'
      });
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal memperbarui SIM'
      );
    }

    logger.info({
      sim_id: updatedSIM.sim_id,
      nomor_sim: updatedSIM.nomor_sim,
      message: 'Update SIM successful'
    });

    return updatedSIM;
  }

  /**
   * Menghapus SIM.
   */
  async deleteSIM(request: GetSIMRequest): Promise<void> {
    logger.info({
      sim_id: request.sim_id,
      message: 'Delete SIM attempt started'
    });

    // Validasi parameter
    const validatedParams = Validation.validate(SIMValidation.DELETE, request);

    const simExists = await this.simRepository.findById(validatedParams.sim_id);
    if (!simExists) {
      logger.warn({
        sim_id: validatedParams.sim_id,
        message: 'Delete SIM failed: SIM not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'SIM tidak ditemukan');
    }

    // Delete picture file
    if (simExists.picture_path) {
      await deleteImage(simExists.picture_path);
    }

    const deleted = await this.simRepository.delete(validatedParams.sim_id);
    if (!deleted) {
      logger.error({
        sim_id: validatedParams.sim_id,
        message: 'Delete SIM failed: Database delete failed'
      });
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal menghapus SIM'
      );
    }

    logger.info({
      sim_id: validatedParams.sim_id,
      nomor_sim: simExists.nomor_sim,
      message: 'Delete SIM successful'
    });
  }
}
