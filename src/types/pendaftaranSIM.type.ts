import {
  PendaftaranSIM,
  StatusPendaftaran,
  JenisSIM
} from '../models/pendaftaranSIM.model';

/**
 * Request untuk membuat pendaftaran SIM baru (User role)
 */
export interface CreatePendaftaranSIMRequest {
  satpas_id: string;
  jenis_sim: JenisSIM;
  tanggal_ujian: string; // Format: YYYY-MM-DD
}

/**
 * Request untuk update status pendaftaran (Admin role only)
 */
export interface UpdateStatusPendaftaranRequest {
  pendaftaran_id: string;
  status: StatusPendaftaran;
}

/**
 * Request untuk get pendaftaran by ID
 */
export interface GetPendaftaranSIMRequest {
  pendaftaran_id: string;
}

/**
 * Request untuk delete pendaftaran
 */
export interface DeletePendaftaranSIMRequest {
  pendaftaran_id: string;
}

/**
 * Response untuk data Pendaftaran SIM
 */
export type PendaftaranSIMResponse = Omit<
  PendaftaranSIM,
  'created_at' | 'updated_at'
> & {
  created_at: string;
  updated_at: string;
};

/**
 * Konversi model PendaftaranSIM ke response format
 */
export function toPendaftaranSIMResponse(
  pendaftaran: PendaftaranSIM
): PendaftaranSIMResponse {
  return {
    pendaftaran_id: pendaftaran.pendaftaran_id,
    kode_pendaftaran: pendaftaran.kode_pendaftaran,
    user_id: pendaftaran.user_id,
    satpas_id: pendaftaran.satpas_id,
    jenis_sim: pendaftaran.jenis_sim,
    tanggal_ujian: pendaftaran.tanggal_ujian,
    status: pendaftaran.status,
    created_at: pendaftaran.created_at.toISOString(),
    updated_at: pendaftaran.updated_at.toISOString()
  };
}
