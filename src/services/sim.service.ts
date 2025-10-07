import { SIMRepository } from '../repositories/sim.repository';
import { SIM, JenisSIM } from '../models/sim.model';
import {
  SIMPaginationParams,
  PaginationResponse
} from '../types/pagination.type';
import {
  SIMResponse,
  CreateSIMRequest,
  UpdateSIMRequest,
  GetSIMRequest,
  DeleteSIMRequest
} from '../types/sim.type';
import { generateNomorSIM } from '../utils/sim-generator';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import { SIMValidation } from '../validations/sim.validation';
import { Validation } from '../validations/validatiom';
import logger from '../utils/logger';

/**
 * Service untuk operasi bisnis terkait SIM.
 */
export class SIMService {
  private simRepository: SIMRepository;

  constructor() {
    this.simRepository = new SIMRepository();
  }

  /**
   * Membuat SIM baru.
   */
  async createSIM(
    simData: CreateSIMRequest,
    createdBy: string
  ): Promise<SIMResponse> {
    logger.info({
      nik: simData.nik,
      created_by: createdBy,
      message: 'Create SIM attempt started'
    });

    // Validasi input menggunakan Validation utility
    const validatedData = Validation.validate(SIMValidation.CREATE, simData);

    // Validasi kombinasi NIK + jenis_sim sudah ada
    const nikJenisExists = await this.simRepository.isNikJenisExists(
      validatedData.nik,
      validatedData.jenis_sim
    );
    if (nikJenisExists) {
      logger.warn({
        nik: validatedData.nik,
        jenis_sim: validatedData.jenis_sim,
        created_by: createdBy,
        message: 'Create SIM failed: NIK + jenis SIM combination already exists'
      });
      throw new ResponseError(
        StatusCodes.CONFLICT,
        `NIK ${validatedData.nik} sudah memiliki SIM jenis ${validatedData.jenis_sim.toUpperCase()}`
      );
    }

    // Generate nomor SIM berdasarkan pola NIK
    // Cari nomor urut terakhir yang sudah digunakan untuk pattern ini
    const basePattern =
      validatedData.nik.substring(0, 6) +
      (validatedData.jenis_kelamin.toLowerCase() === 'perempuan'
        ? (validatedData.tanggal_lahir.getDate() + 40)
            .toString()
            .padStart(2, '0')
        : validatedData.tanggal_lahir.getDate().toString().padStart(2, '0')) +
      (validatedData.tanggal_lahir.getMonth() + 1).toString().padStart(2, '0') +
      (validatedData.tanggal_lahir.getFullYear() % 100)
        .toString()
        .padStart(2, '0');

    // Cari nomor urut terakhir yang sudah digunakan untuk pattern ini
    const lastUsedNumber =
      await this.simRepository.getLastUsedSequenceNumber(basePattern);
    const nomorUrut = (lastUsedNumber || 0) + 1;

    // Generate nomor SIM dengan nomor urut yang sudah dipastikan unik
    const nomorSIM = generateNomorSIM(
      validatedData.nik,
      validatedData.jenis_kelamin,
      validatedData.tanggal_lahir,
      nomorUrut
    );

    // Double check untuk memastikan nomor SIM unik (safety measure)
    const nomorSimExists = await this.simRepository.isNomorSimExists(nomorSIM);
    if (nomorSimExists) {
      logger.error({
        nik: validatedData.nik,
        nomor_sim: nomorSIM,
        created_by: createdBy,
        message:
          'Create SIM failed: Generated SIM number still exists (race condition)'
      });
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal membuat nomor SIM unik'
      );
    }

    logger.info({
      nik: validatedData.nik,
      nomor_sim: nomorSIM,
      nomor_urut: nomorUrut,
      created_by: createdBy,
      message: 'SIM number generated successfully'
    });

    // Buat SIM data untuk database
    const simToCreate: Omit<SIM, 'sim_id' | 'created_at' | 'updated_at'> = {
      nomor_sim: nomorSIM,
      full_name: validatedData.full_name,
      nik: validatedData.nik,
      rt: validatedData.rt,
      rw: validatedData.rw,
      kecamatan: validatedData.kecamatan,
      kabupaten: validatedData.kabupaten,
      provinsi: validatedData.provinsi,
      jenis_sim: validatedData.jenis_sim as JenisSIM,
      tanggal_expired: validatedData.tanggal_expired,
      jenis_kelamin: validatedData.jenis_kelamin,
      gol_darah: validatedData.gol_darah,
      tempat_lahir: validatedData.tempat_lahir,
      tanggal_lahir: validatedData.tanggal_lahir,
      pekerjaan: validatedData.pekerjaan,
      picture_path: validatedData.picture_path,
      created_by: createdBy
    };

    const result = await this.simRepository.create(simToCreate);

    logger.info({
      sim_id: result.sim_id,
      nomor_sim: result.nomor_sim,
      nik: result.nik,
      created_by: createdBy,
      message: 'Create SIM successful'
    });

    return result;
  }

  /**
   * Mengambil daftar SIM dengan pagination.
   */
  async getSIMs(
    params: SIMPaginationParams
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
   * Memperbarui data SIM.
   */
  async updateSIM(request: UpdateSIMRequest): Promise<SIMResponse> {
    logger.info({
      sim_id: request.sim_id,
      message: 'Update SIM attempt started'
    });

    // Validasi parameter dan data menggunakan Validation utility
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

    // Validasi kombinasi NIK + jenis_sim jika diupdate
    const nikToCheck = validatedData.nik || existingSIM.nik;
    const jenisSimToCheck = validatedData.jenis_sim || existingSIM.jenis_sim;

    if (
      (validatedData.nik && validatedData.nik !== existingSIM.nik) ||
      (validatedData.jenis_sim &&
        validatedData.jenis_sim !== existingSIM.jenis_sim)
    ) {
      const nikJenisExists = await this.simRepository.isNikJenisExists(
        nikToCheck,
        jenisSimToCheck,
        validatedData.sim_id
      );
      if (nikJenisExists) {
        logger.warn({
          sim_id: validatedData.sim_id,
          nik: nikToCheck,
          jenis_sim: jenisSimToCheck,
          message:
            'Update SIM failed: NIK + jenis SIM combination already exists'
        });
        throw new ResponseError(
          StatusCodes.CONFLICT,
          `NIK ${nikToCheck} sudah memiliki SIM jenis ${jenisSimToCheck.toUpperCase()}`
        );
      }
    }

    // Hapus sim_id dari update data karena tidak boleh diupdate
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sim_id: _sim_id, ...dataToUpdate } = validatedData as Partial<
      Omit<SIM, 'sim_id' | 'created_by' | 'created_at'>
    > & { sim_id?: string };

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
  async deleteSIM(request: DeleteSIMRequest): Promise<void> {
    logger.info({
      sim_id: request.sim_id,
      message: 'Delete SIM attempt started'
    });

    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(SIMValidation.DELETE, request);

    const simExists = await this.simRepository.findById(validatedParams.sim_id);
    if (!simExists) {
      logger.warn({
        sim_id: validatedParams.sim_id,
        message: 'Delete SIM failed: SIM not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'SIM tidak ditemukan');
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
