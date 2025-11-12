import { SIM } from '../models/sim.model';
import moment from 'moment-timezone';

/**
 * Request untuk membuat SIM baru (form-data).
 * Pendaftaran ID, tanggal terbit, dan tanggal expired dari form.
 * Picture dari file upload.
 */
export type CreateSIMRequest = {
  pendaftaran_id: string;
  tanggal_terbit: string;
  tanggal_expired: string;
};

/**
 * Request untuk memperbarui SIM (form-data).
 * Hanya tanggal expired dan picture yang bisa diupdate.
 */
export type UpdateSIMRequest = {
  sim_id: string;
  tanggal_expired?: string;
};

/**
 * Request untuk mengambil detail SIM berdasarkan ID.
 */
export type GetSIMRequest = {
  sim_id: string;
};

/**
 * Request untuk menghapus SIM berdasarkan ID.
 */
export type DeleteSIMRequest = {
  sim_id: string;
};

/**
 * Struktur response umum untuk data SIM.
 */
export type SIMResponse = Omit<
  SIM,
  'tanggal_terbit' | 'tanggal_expired' | 'created_at' | 'updated_at'
> & {
  tanggal_terbit: string;
  tanggal_expired: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
};

/**
 * Mengubah instance model SIM menjadi objek response yang konsisten.
 *
 * @param {SIM} sim - Objek SIM dari database.
 * @returns {SIMResponse} - Representasi SIM yang siap dikirim sebagai response.
 */
export function toSIMResponse(
  sim: SIM & { creator_name?: string }
): SIMResponse {
  return {
    sim_id: sim.sim_id,
    nomor_sim: sim.nomor_sim,
    pendaftaran_id: sim.pendaftaran_id,
    tanggal_terbit: moment(sim.tanggal_terbit)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY'),
    tanggal_expired: moment(sim.tanggal_expired)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY'),
    picture_path: sim.picture_path,
    created_by: sim.created_by,
    created_at: moment(sim.created_at)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY HH:mm:ss'),
    updated_at: moment(sim.updated_at)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY HH:mm:ss'),
    creator_name: sim.creator_name
  };
}
