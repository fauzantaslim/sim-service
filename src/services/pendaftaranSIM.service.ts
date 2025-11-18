import { PendaftaranSIMRepository } from '../repositories/pendaftaranSIM.repository';
import {
  PendaftaranSIM,
  StatusPendaftaran
} from '../models/pendaftaranSIM.model';
import { PaginationParams, PaginationResponse } from '../types/pagination.type';
import {
  PendaftaranSIMResponse,
  CreatePendaftaranSIMRequest,
  UpdateStatusPendaftaranRequest,
  GetPendaftaranSIMRequest
} from '../types/pendaftaranSIM.type';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import { PendaftaranSIMValidation } from '../validations/pendaftaranSIM.validation';
import { Validation } from '../validations/validatiom';
import logger from '../utils/logger';
import db from '../configs/database';
import axios from 'axios';
import { DataPemohonRepository } from '../repositories/dataPemohon.repository';
import { AuthUserRepository } from '../repositories/authUser.repository';

interface KTPApiData {
  nik?: string;
  nama_lengkap?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  golongan_darah?: string;
  pekerjaan?: string;
  rt?: string;
  rw?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  [key: string]: unknown;
}

interface KTPApiResponse {
  success?: boolean;
  data?: KTPApiData;
}

/**
 * Service untuk operasi bisnis terkait Pendaftaran SIM.
 */
export class PendaftaranSIMService {
  private pendaftaranRepository: PendaftaranSIMRepository;
  private dataPemohonRepository: DataPemohonRepository;
  private authUserRepository: AuthUserRepository;

  constructor() {
    this.pendaftaranRepository = new PendaftaranSIMRepository();
    this.dataPemohonRepository = new DataPemohonRepository();
    this.authUserRepository = new AuthUserRepository();
  }

  /**
   * Membuat pendaftaran SIM baru (User role).
   */
  async createPendaftaran(
    userId: string,
    pendaftaranData: CreatePendaftaranSIMRequest
  ): Promise<PendaftaranSIMResponse> {
    logger.info({
      user_id: userId,
      satpas_id: pendaftaranData.satpas_id,
      jenis_sim: pendaftaranData.jenis_sim,
      message: 'Create Pendaftaran SIM attempt started'
    });

    // Validasi input
    const validatedData = Validation.validate(
      PendaftaranSIMValidation.CREATE,
      pendaftaranData
    );

    // Cek apakah satpas exists
    const satpas = await db('satpas')
      .where('satpas_id', validatedData.satpas_id)
      .first();

    if (!satpas) {
      logger.warn({
        satpas_id: validatedData.satpas_id,
        message: 'Create Pendaftaran failed: Satpas not found'
      });
      throw new ResponseError(StatusCodes.NOT_FOUND, 'Satpas tidak ditemukan');
    }

    // Cek apakah user sudah punya pendaftaran aktif untuk jenis SIM ini
    const hasActive = await this.pendaftaranRepository.hasActivePendaftaran(
      userId,
      validatedData.jenis_sim
    );

    if (hasActive) {
      logger.warn({
        user_id: userId,
        jenis_sim: validatedData.jenis_sim,
        message:
          'Create Pendaftaran failed: User already has active registration'
      });
      throw new ResponseError(
        StatusCodes.CONFLICT,
        `Anda sudah memiliki pendaftaran aktif untuk SIM ${validatedData.jenis_sim.toUpperCase()}`
      );
    }

    // Ambil NIK user atau fallback dari request body, lalu fetch data KTP (best effort)
    let ktpData: KTPApiData | null = null;
    try {
      const user = await this.authUserRepository.findById(userId);
      const nikForLookup = user?.nik ?? pendaftaranData.nik;
      if (nikForLookup) {
        const url = `https://ktp.chasouluix.biz.id/api/ktp/nik/${encodeURIComponent(
          nikForLookup
        )}`;
        const resp = await axios.get<KTPApiResponse>(url);
        if (resp.status === 200) {
          const apiResponse = resp.data;
          if (apiResponse?.success && apiResponse.data) {
            ktpData = apiResponse.data;
            logger.info({
              url: url,
              nik: nikForLookup,
              message: 'KTP data fetched successfully'
            });
          } else {
            logger.warn({
              url: url,
              nik: nikForLookup,
              message: 'KTP API responded without data or success=false'
            });
          }
        } else {
          logger.warn({
            url: url,
            nik: nikForLookup,
            status: resp.status,
            message: 'KTP API responded with non-OK status'
          });
        }
      } else {
        logger.warn({
          user_id: userId,
          message:
            'NIK not provided in user profile or request body. Skip KTP fetch'
        });
      }
    } catch (error) {
      logger.error({ error, message: 'Failed to fetch KTP data' });
    }

    // Buat pendaftaran
    const pendaftaranToCreate: Omit<
      PendaftaranSIM,
      | 'pendaftaran_id'
      | 'kode_pendaftaran'
      | 'status'
      | 'created_at'
      | 'updated_at'
    > = {
      user_id: userId,
      satpas_id: validatedData.satpas_id,
      jenis_sim: validatedData.jenis_sim,
      tanggal_ujian: new Date(validatedData.tanggal_ujian)
    };

    const result = await this.pendaftaranRepository.create(pendaftaranToCreate);

    // Simpan Data Pemohon dari KTP API jika tersedia
    if (ktpData) {
      try {
        await this.dataPemohonRepository.upsertByPendaftaranId(
          result.pendaftaran_id,
          {
            full_name: ktpData.nama_lengkap ?? '',
            nik: ktpData.nik ?? '',
            tempat_lahir: ktpData.tempat_lahir ?? '',
            tanggal_lahir: ktpData.tanggal_lahir
              ? new Date(ktpData.tanggal_lahir)
              : new Date('1970-01-01'),
            jenis_kelamin: ktpData.jenis_kelamin ?? '',
            gol_darah: ktpData.golongan_darah ?? '-',
            pekerjaan: ktpData.pekerjaan ?? '',
            alamat_rt: ktpData.rt ?? '',
            alamat_rw: ktpData.rw ?? '',
            kecamatan: ktpData.kecamatan ?? '',
            kabupaten: ktpData.kabupaten ?? '',
            provinsi: ktpData.provinsi ?? ''
          }
        );
        logger.info({
          pendaftaran_id: result.pendaftaran_id,
          message: 'Data Pemohon saved from KTP API'
        });
      } catch (error) {
        logger.error({
          pendaftaran_id: result.pendaftaran_id,
          error,
          message: 'Failed to save Data Pemohon from KTP API'
        });
      }
    }

    logger.info({
      pendaftaran_id: result.pendaftaran_id,
      kode_pendaftaran: result.kode_pendaftaran,
      user_id: userId,
      message: 'Create Pendaftaran SIM successful'
    });

    return result;
  }

  /**
   * Mengambil semua pendaftaran dengan pagination (Admin only).
   */
  async getAllPendaftaran(
    params: PaginationParams
  ): Promise<PaginationResponse<PendaftaranSIMResponse>> {
    logger.info({
      page: params.page,
      limit: params.limit,
      search: params.search,
      message: 'Get all Pendaftaran SIM attempt started'
    });

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

    const result = await this.pendaftaranRepository.findAll(params);

    logger.info({
      page: params.page,
      limit: params.limit,
      total_items: result.pagination.total_items,
      message: 'Get all Pendaftaran SIM successful'
    });

    return result;
  }

  /**
   * Mengambil pendaftaran berdasarkan user ID (User role).
   */
  async getPendaftaranByUserId(
    userId: string,
    params: PaginationParams
  ): Promise<PaginationResponse<PendaftaranSIMResponse>> {
    logger.info({
      user_id: userId,
      page: params.page,
      limit: params.limit,
      message: 'Get Pendaftaran by User ID attempt started'
    });

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

    const result = await this.pendaftaranRepository.findByUserId(
      userId,
      params
    );

    logger.info({
      user_id: userId,
      page: params.page,
      limit: params.limit,
      total_items: result.pagination.total_items,
      message: 'Get Pendaftaran by User ID successful'
    });

    return result;
  }

  /**
   * Mengambil detail pendaftaran berdasarkan ID.
   */
  async getPendaftaranById(
    request: GetPendaftaranSIMRequest
  ): Promise<PendaftaranSIMResponse> {
    logger.info({
      pendaftaran_id: request.pendaftaran_id,
      message: 'Get Pendaftaran by ID attempt started'
    });

    const validatedParams = Validation.validate(
      PendaftaranSIMValidation.GET,
      request
    );

    const pendaftaran = await this.pendaftaranRepository.findById(
      validatedParams.pendaftaran_id
    );

    if (!pendaftaran) {
      logger.warn({
        pendaftaran_id: validatedParams.pendaftaran_id,
        message: 'Get Pendaftaran by ID failed: Not found'
      });
      throw new ResponseError(
        StatusCodes.NOT_FOUND,
        'Pendaftaran tidak ditemukan'
      );
    }

    logger.info({
      pendaftaran_id: pendaftaran.pendaftaran_id,
      message: 'Get Pendaftaran by ID successful'
    });

    return pendaftaran;
  }

  /**
   * Update status pendaftaran (Admin only).
   */
  async updateStatus(
    request: UpdateStatusPendaftaranRequest
  ): Promise<PendaftaranSIMResponse> {
    logger.info({
      pendaftaran_id: request.pendaftaran_id,
      status: request.status,
      message: 'Update Pendaftaran status attempt started'
    });

    // Validasi input
    const validatedData = Validation.validate(
      PendaftaranSIMValidation.UPDATE_STATUS,
      request
    );

    // Cek pendaftaran exists
    const existingPendaftaran = await this.pendaftaranRepository.findById(
      validatedData.pendaftaran_id
    );

    if (!existingPendaftaran) {
      logger.warn({
        pendaftaran_id: validatedData.pendaftaran_id,
        message: 'Update status failed: Pendaftaran not found'
      });
      throw new ResponseError(
        StatusCodes.NOT_FOUND,
        'Pendaftaran tidak ditemukan'
      );
    }

    // Validasi transisi status
    this.validateStatusTransition(
      existingPendaftaran.status as StatusPendaftaran,
      validatedData.status
    );

    // Update status
    const updatedPendaftaran = await this.pendaftaranRepository.updateStatus(
      validatedData.pendaftaran_id,
      validatedData.status
    );

    if (!updatedPendaftaran) {
      logger.error({
        pendaftaran_id: validatedData.pendaftaran_id,
        message: 'Update status failed: Database update failed'
      });
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal memperbarui status pendaftaran'
      );
    }

    logger.info({
      pendaftaran_id: updatedPendaftaran.pendaftaran_id,
      old_status: existingPendaftaran.status,
      new_status: updatedPendaftaran.status,
      message: 'Update Pendaftaran status successful'
    });

    return updatedPendaftaran;
  }

  /**
   * Validasi transisi status pendaftaran.
   */
  private validateStatusTransition(
    currentStatus: StatusPendaftaran,
    newStatus: StatusPendaftaran
  ): void {
    // Define valid transitions
    const validTransitions: Record<StatusPendaftaran, StatusPendaftaran[]> = {
      diajukan: ['diperiksa', 'ditolak'],
      diperiksa: ['disetujui', 'ditolak'],
      disetujui: ['proses_ujian'],
      proses_ujian: ['ujian_gagal', 'selesai'],
      ujian_gagal: ['proses_ujian'], // bisa ujian ulang
      selesai: [], // final state
      ditolak: [] // final state
    };

    const allowedStatuses = validTransitions[currentStatus];

    if (!allowedStatuses.includes(newStatus)) {
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        `Tidak dapat mengubah status dari "${currentStatus}" ke "${newStatus}"`
      );
    }
  }
}
