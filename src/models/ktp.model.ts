// models/ktp.model.ts

export enum JenisKelamin {
  LAKI_LAKI = 'laki_laki',
  PEREMPUAN = 'perempuan'
}

export enum Agama {
  ISLAM = 'islam',
  KRISTEN = 'kristen',
  KATOLIK = 'katolik',
  HINDU = 'hindu',
  BUDDHA = 'buddha',
  KONGHUCHU = 'konghucu',
  LAINNYA = 'lainnya'
}

export enum StatusPerkawinan {
  BELUM_KAWIN = 'belum_kawin',
  KAWIN = 'kawin',
  CERAI_HIDUP = 'cerai_hidup',
  CERAI_MATI = 'cerai_mati'
}

export enum GolonganDarah {
  A = 'a',
  B = 'b',
  AB = 'ab',
  O = 'o',
  TIDAK_TAHU = 'tidak_tahu'
}

export interface KTP {
  ktp_id: string;
  nik: string;
  alamat: string;
  tempat_lahir: string;
  tanggal_lahir: Date;
  jenis_kelamin: JenisKelamin;
  agama: Agama;
  status_perkawinan: StatusPerkawinan;
  gol_darah: GolonganDarah;
  pekerjaan: string;
  kewarganegaraan: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
