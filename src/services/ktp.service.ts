import { KTPRepository } from '../repositories/ktp.repository';
import {
  KTP,
  JenisKelamin,
  Agama,
  StatusPerkawinan,
  GolonganDarah
} from '../models/ktp.model';
import {
  KTPPaginationParams,
  PaginationResponse
} from '../types/pagination.type';
import {
  KTPResponse,
  CreateKTPRequest,
  UpdateKTPRequest,
  GetKTPRequest,
  DeleteKTPRequest
} from '../types/ktp.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import { KTPValidation } from '../validations/ktp.validation';
import { Validation } from '../validations/validatiom';

/**
 * Service untuk operasi bisnis terkait KTP.
 */
export class KTPService {
  private ktpRepository: KTPRepository;

  constructor() {
    this.ktpRepository = new KTPRepository();
  }

  /**
   * Membuat KTP baru.
   */
  async createKTP(
    ktpData: CreateKTPRequest,
    createdBy: string
  ): Promise<KTPResponse> {
    // Validasi input menggunakan Validation utility
    const validatedData = Validation.validate(KTPValidation.CREATE, ktpData);

    // Validasi NIK sudah ada
    const nikExists = await this.ktpRepository.isNIKExists(validatedData.nik);
    if (nikExists) {
      throw new ResponseError(
        StatusCodes.CONFLICT,
        'NIK sudah digunakan oleh KTP lain'
      );
    }

    // Buat KTP data untuk database
    const ktpToCreate: Omit<KTP, 'ktp_id' | 'created_at' | 'updated_at'> = {
      nik: validatedData.nik,
      alamat: validatedData.alamat,
      tempat_lahir: validatedData.tempat_lahir,
      tanggal_lahir: validatedData.tanggal_lahir,
      jenis_kelamin: validatedData.jenis_kelamin as JenisKelamin,
      agama: validatedData.agama as Agama,
      status_perkawinan: validatedData.status_perkawinan as StatusPerkawinan,
      gol_darah: validatedData.gol_darah as GolonganDarah,
      pekerjaan: validatedData.pekerjaan,
      kewarganegaraan: validatedData.kewarganegaraan,
      created_by: createdBy
    };

    return await this.ktpRepository.create(ktpToCreate);
  }

  /**
   * Mengambil daftar KTP dengan pagination.
   */
  async getKTPs(
    params: KTPPaginationParams
  ): Promise<PaginationResponse<KTPResponse>> {
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

    return await this.ktpRepository.findAll(params);
  }

  /**
   * Mengambil detail KTP berdasarkan ID.
   */
  async getKTPById(request: GetKTPRequest): Promise<KTPResponse> {
    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(KTPValidation.GET, request);

    const ktp = await this.ktpRepository.findById(validatedParams.ktp_id);

    if (!ktp) {
      throw new ResponseError(StatusCodes.NOT_FOUND, 'KTP tidak ditemukan');
    }

    return ktp;
  }

  /**
   * Memperbarui data KTP.
   */
  async updateKTP(request: UpdateKTPRequest): Promise<KTPResponse> {
    // Validasi parameter dan data menggunakan Validation utility
    const validatedData = Validation.validate(KTPValidation.UPDATE, request);

    // Cek KTP ada atau tidak
    const existingKTP = await this.ktpRepository.findById(validatedData.ktp_id);
    if (!existingKTP) {
      throw new ResponseError(StatusCodes.NOT_FOUND, 'KTP tidak ditemukan');
    }

    // Validasi NIK jika diupdate
    if (validatedData.nik && validatedData.nik !== existingKTP.nik) {
      const nikExists = await this.ktpRepository.isNIKExists(
        validatedData.nik,
        validatedData.ktp_id
      );
      if (nikExists) {
        throw new ResponseError(
          StatusCodes.CONFLICT,
          'NIK sudah digunakan oleh KTP lain'
        );
      }
    }

    // Hapus ktp_id dari update data karena tidak boleh diupdate
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ktp_id: _ktp_id, ...dataToUpdate } = validatedData as Partial<
      Omit<KTP, 'ktp_id' | 'created_by' | 'created_at'>
    > & { ktp_id?: string };

    const updatedKTP = await this.ktpRepository.update(
      validatedData.ktp_id,
      dataToUpdate
    );
    if (!updatedKTP) {
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal memperbarui KTP'
      );
    }

    return updatedKTP;
  }

  /**
   * Menghapus KTP.
   */
  async deleteKTP(request: DeleteKTPRequest): Promise<void> {
    // Validasi parameter menggunakan Validation utility
    const validatedParams = Validation.validate(KTPValidation.DELETE, request);

    const ktpExists = await this.ktpRepository.findById(validatedParams.ktp_id);
    if (!ktpExists) {
      throw new ResponseError(StatusCodes.NOT_FOUND, 'KTP tidak ditemukan');
    }

    const deleted = await this.ktpRepository.delete(validatedParams.ktp_id);
    if (!deleted) {
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal menghapus KTP'
      );
    }
  }
}
