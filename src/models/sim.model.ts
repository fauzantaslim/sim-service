// models/sim.model.ts

export enum JenisSIM {
  A = 'a',
  B1 = 'b1',
  B2 = 'b2',
  C = 'c',
  D = 'd'
}

export interface SIM {
  sim_id: string;
  nomor_sim: string;
  jenis_sim: JenisSIM;
  tanggal_terbit: Date;
  tanggal_expired: Date;
  ktp_id: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
