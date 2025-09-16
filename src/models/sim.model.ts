// models/sim.model.ts

export enum JenisSIM {
  A = 'a',
  B1 = 'b1',
  B2 = 'b2',
  C = 'c',
  C1 = 'c1',
  C2 = 'c2',
  D = 'd'
}

export interface SIM {
  sim_id: string;
  nomor_sim: string;
  full_name: string;
  nik: string;
  rt: string;
  rw: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  jenis_sim: JenisSIM | string;
  tanggal_expired: Date;
  jenis_kelamin: string;
  gol_darah: string;
  tempat_lahir: string;
  tanggal_lahir: Date;
  pekerjaan: string;
  picture_path: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
