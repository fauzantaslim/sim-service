import { SIM } from '../models/sim.model';
import { DataPemohon } from '../models/dataPemohon.model';
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

type DataPemohonResponse = Omit<
  DataPemohon,
  | 'pemohon_id'
  | 'pendaftaran_id'
  | 'tanggal_lahir'
  | 'created_at'
  | 'updated_at'
> & {
  tanggal_lahir: string;
  created_at: string;
  updated_at: string;
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
  jenis_sim?: string;
  data_pemohon?: DataPemohonResponse;
};

// Extended type for database query results
type SIMWithJoinedData = SIM & {
  creator_name?: string;
  jenis_sim?: string;
  pemohon_id?: string;
  pemohon_pendaftaran_id?: string;
  full_name?: string;
  nik?: string;
  tempat_lahir?: string;
  tanggal_lahir?: Date;
  jenis_kelamin?: string;
  gol_darah?: string;
  pekerjaan?: string;
  alamat_rt?: string;
  alamat_rw?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  pemohon_created_at?: Date;
  pemohon_updated_at?: Date;
};

/**
 * Mengubah instance model SIM menjadi objek response yang konsisten.
 *
 * @param {SIMWithJoinedData} sim - Objek SIM dari database dengan data gabungan.
 * @returns {SIMResponse} - Representasi SIM yang siap dikirim sebagai response.
 */
export function toSIMResponse(sim: SIMWithJoinedData): SIMResponse {
  const response: Partial<SIMResponse> = {
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
    creator_name: sim.creator_name,
    jenis_sim: sim.jenis_sim
  };

  // Add applicant data if available
  if (sim.pemohon_id) {
    response.data_pemohon = {
      full_name: sim.full_name || '',
      nik: sim.nik || '',
      tempat_lahir: sim.tempat_lahir || '',
      tanggal_lahir: moment(sim.tanggal_lahir)
        .utc()
        .tz('Asia/Jakarta')
        .format('DD-MM-YYYY'),
      jenis_kelamin: sim.jenis_kelamin || '',
      gol_darah: sim.gol_darah || '',
      pekerjaan: sim.pekerjaan || '',
      alamat_rt: sim.alamat_rt || '',
      alamat_rw: sim.alamat_rw || '',
      kecamatan: sim.kecamatan || '',
      kabupaten: sim.kabupaten || '',
      provinsi: sim.provinsi || '',
      created_at: moment(sim.pemohon_created_at)
        .utc()
        .tz('Asia/Jakarta')
        .format('DD-MM-YYYY HH:mm:ss'),
      updated_at: moment(sim.pemohon_updated_at)
        .utc()
        .tz('Asia/Jakarta')
        .format('DD-MM-YYYY HH:mm:ss')
    };
  }

  return response as SIMResponse;
}
