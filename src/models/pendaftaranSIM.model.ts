// models/pendaftaranSIM.model.ts

export type StatusPendaftaran =
  | 'diajukan'
  | 'diperiksa'
  | 'disetujui'
  | 'proses_ujian'
  | 'ujian_gagal'
  | 'selesai'
  | 'ditolak';

export type JenisSIM =
  | 'a'
  | 'a_umum'
  | 'bi'
  | 'bi_umum'
  | 'bii'
  | 'bii_umum'
  | 'c'
  | 'ci'
  | 'cii'
  | 'd'
  | 'di';

export interface PendaftaranSIM {
  pendaftaran_id: string;
  kode_pendaftaran: string;
  user_id: string;
  satpas_id: string;
  jenis_sim: JenisSIM;
  tanggal_ujian: Date;
  status: StatusPendaftaran;
  created_at: Date;
  updated_at: Date;
}
