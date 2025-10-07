// models/sim.model.ts

export enum JenisSIM {
  A = 'a', // SIM A - Mobil penumpang/barang perseorangan (max 3.500 kg)
  A_UMUM = 'a_umum', // SIM A Umum - Mobil penumpang/barang umum (max 3.500 kg)
  BI = 'bi', // SIM BI - Bus/barang perseorangan (>3.500 kg)
  BI_UMUM = 'bi_umum', // SIM BI Umum - Bus/barang umum (>3.500 kg)
  BII = 'bii', // SIM BII - Kendaraan alat berat perseorangan
  BII_UMUM = 'bii_umum', // SIM BII Umum - Kendaraan alat berat umum
  C = 'c', // SIM C - Sepeda motor (max 250 cc)
  CI = 'ci', // SIM CI - Sepeda motor (250-500 cc)
  CII = 'cii', // SIM CII - Sepeda motor (>500 cc)
  D = 'd', // SIM D - Kendaraan khusus disabilitas (setara SIM C)
  DI = 'di' // SIM DI - Kendaraan khusus disabilitas (setara SIM A)
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
