export interface DataPemohon {
  pemohon_id: string;
  pendaftaran_id: string;
  full_name: string;
  nik: string;
  tempat_lahir: string;
  tanggal_lahir: Date;
  jenis_kelamin: string;
  gol_darah: string;
  pekerjaan: string;
  alamat_rt: string;
  alamat_rw: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  created_at: Date;
  updated_at: Date;
}
