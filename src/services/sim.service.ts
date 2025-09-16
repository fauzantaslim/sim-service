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
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import { SIMValidation } from '../validations/sim.validation';
import { Validation } from '../validations/validatiom';

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
    // Validasi input menggunakan Validation utility
    const validatedData = Validation.validate(SIMValidation.CREATE, simData);

    // Validasi nomor SIM sudah ada
    const nomorSimExists = await this.simRepository.isNomorSimExists(
      validatedData.nomor_sim
    );
    if (nomorSimExists) {
      throw new ResponseError(
        StatusCodes.CONFLICT,
        'Nomor SIM sudah digunakan oleh SIM lain'
      );
    }

    // Validasi nik sudah ada
    const nikExists = await this.simRepository.isNikExists(validatedData.nik);
    if (nikExists) {
      throw new ResponseError(
        StatusCodes.CONFLICT,
        'NIK sudah digunakan oleh SIM lain'
      );
    }

    // Buat SIM data untuk database
    const simToCreate: Omit<SIM, 'sim_id' | 'created_at' | 'updated_at'> = {
      nomor_sim: validatedData.nomor_sim,
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

    return await this.simRepository.create(simToCreate);
  }

  /**
   * Mengambil daftar SIM dengan pagination.
   */
  async getSIMs(
    params: SIMPaginationParams
  ): Promise<PaginationResponse<SIMResponse>> {
    // Validasi parameter pagination
    if (params.page < 1) {
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Halaman harus lebih dari 0'
      );
    }

    if (params.limit < 1 || params.limit > 100) {
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Limit harus antara 1-100'
      );
    }

    return await this.simRepository.findAll(params);
  }

  /**
   * Mengambil detail SIM berdasarkan ID.
   */
  async getSIMById(request: GetSIMRequest): Promise<SIMResponse> {
    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(SIMValidation.GET, request);

    const sim = await this.simRepository.findById(validatedParams.sim_id);

    if (!sim) {
      throw new ResponseError(StatusCodes.NOT_FOUND, 'SIM tidak ditemukan');
    }

    return sim;
  }

  /**
   * Memperbarui data SIM.
   */
  async updateSIM(request: UpdateSIMRequest): Promise<SIMResponse> {
    // Validasi parameter dan data menggunakan Validation utility
    const validatedData = Validation.validate(SIMValidation.UPDATE, request);

    // Cek SIM ada atau tidak
    const existingSIM = await this.simRepository.findById(validatedData.sim_id);
    if (!existingSIM) {
      throw new ResponseError(StatusCodes.NOT_FOUND, 'SIM tidak ditemukan');
    }

    // Validasi nomor SIM jika diupdate
    if (
      validatedData.nomor_sim &&
      validatedData.nomor_sim !== existingSIM.nomor_sim
    ) {
      const nomorSimExists = await this.simRepository.isNomorSimExists(
        validatedData.nomor_sim,
        validatedData.sim_id
      );
      if (nomorSimExists) {
        throw new ResponseError(
          StatusCodes.CONFLICT,
          'Nomor SIM sudah digunakan oleh SIM lain'
        );
      }
    }

    // Validasi nik jika diupdate
    if (validatedData.nik && validatedData.nik !== existingSIM.nik) {
      const nikExists = await this.simRepository.isNikExists(
        validatedData.nik,
        validatedData.sim_id
      );
      if (nikExists) {
        throw new ResponseError(
          StatusCodes.CONFLICT,
          'NIK sudah digunakan oleh SIM lain'
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
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal memperbarui SIM'
      );
    }

    return updatedSIM;
  }

  /**
   * Menghapus SIM.
   */
  async deleteSIM(request: DeleteSIMRequest): Promise<void> {
    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(SIMValidation.DELETE, request);

    const simExists = await this.simRepository.findById(validatedParams.sim_id);
    if (!simExists) {
      throw new ResponseError(StatusCodes.NOT_FOUND, 'SIM tidak ditemukan');
    }

    const deleted = await this.simRepository.delete(validatedParams.sim_id);
    if (!deleted) {
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal menghapus SIM'
      );
    }
  }
}
