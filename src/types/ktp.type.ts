import { KTP } from '../models/ktp.model';
import moment from 'moment-timezone';

/**
 * Request untuk membuat KTP baru.
 */
export type CreateKTPRequest = Omit<
  KTP,
  'ktp_id' | 'created_by' | 'created_at' | 'updated_at'
>;

/**
 * Request untuk memperbarui KTP.
 */
export type UpdateKTPRequest = {
  ktp_id: string;
} & Partial<Omit<KTP, 'ktp_id' | 'created_by' | 'created_at'>>;

/**
 * Request untuk mengambil detail KTP berdasarkan ID.
 */
export type GetKTPRequest = {
  ktp_id: string;
};

/**
 * Request untuk menghapus KTP berdasarkan ID.
 */
export type DeleteKTPRequest = {
  ktp_id: string;
};

/**
 * Request untuk mencari KTP berdasarkan NIK.
 */
export type FindKTPByNIKRequest = {
  nik: string;
};

/**
 * Struktur response umum untuk data KTP.
 */
export type KTPResponse = Omit<
  KTP,
  'tanggal_lahir' | 'created_at' | 'updated_at'
> & {
  tanggal_lahir: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
};

/**
 * Mengubah instance model KTP menjadi objek response yang konsisten.
 *
 * @param {KTP} ktp - Objek KTP dari database.
 * @returns {KTPResponse} - Representasi KTP yang siap dikirim sebagai response.
 */
export function toKTPResponse(
  ktp: KTP & { creator_name?: string }
): KTPResponse {
  return {
    ktp_id: ktp.ktp_id,
    nik: ktp.nik,
    alamat: ktp.alamat,
    tempat_lahir: ktp.tempat_lahir,
    tanggal_lahir: moment(ktp.tanggal_lahir)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY'),
    jenis_kelamin: ktp.jenis_kelamin,
    agama: ktp.agama,
    status_perkawinan: ktp.status_perkawinan,
    gol_darah: ktp.gol_darah,
    pekerjaan: ktp.pekerjaan,
    kewarganegaraan: ktp.kewarganegaraan,
    created_by: ktp.created_by,
    created_at: moment(ktp.created_at)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY HH:mm:ss'),
    updated_at: moment(ktp.updated_at)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY HH:mm:ss'),
    creator_name: ktp.creator_name
  };
}
