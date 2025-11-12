// models/sim.model.ts

/**
 * Interface untuk model SIM sesuai dengan struktur database baru.
 * SIM tidak lagi menyimpan data personal, hanya referensi ke pendaftaran.
 */
export interface SIM {
  sim_id: string;
  nomor_sim: string;
  pendaftaran_id: string;
  tanggal_terbit: Date;
  tanggal_expired: Date;
  picture_path: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
