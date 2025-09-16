import { SIM } from '../models/sim.model';
import moment from 'moment-timezone';

/**
 * Request untuk membuat SIM baru.
 */
export type CreateSIMRequest = Omit<
  SIM,
  'sim_id' | 'created_by' | 'created_at' | 'updated_at'
>;

/**
 * Request untuk memperbarui SIM.
 */
export type UpdateSIMRequest = {
  sim_id: string;
} & Partial<Omit<SIM, 'sim_id' | 'created_by' | 'created_at'>>;

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
  'tanggal_lahir' | 'tanggal_expired' | 'created_at' | 'updated_at'
> & {
  tanggal_lahir: string;
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
    full_name: sim.full_name,
    nik: sim.nik,
    rt: sim.rt,
    rw: sim.rw,
    kecamatan: sim.kecamatan,
    kabupaten: sim.kabupaten,
    provinsi: sim.provinsi,
    jenis_sim: sim.jenis_sim,
    tanggal_expired: moment(sim.tanggal_expired)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY'),
    jenis_kelamin: sim.jenis_kelamin,
    gol_darah: sim.gol_darah,
    tempat_lahir: sim.tempat_lahir,
    tanggal_lahir: moment(sim.tanggal_lahir)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY'),
    pekerjaan: sim.pekerjaan,
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
