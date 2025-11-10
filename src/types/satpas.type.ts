import { Satpas } from '../models/satpas.model';
import moment from 'moment-timezone';

/**
 * Request untuk membuat Satpas baru.
 */
export type CreateSatpasRequest = Omit<
  Satpas,
  'satpas_id' | 'created_at' | 'updated_at'
>;

/**
 * Request untuk memperbarui Satpas.
 */
export type UpdateSatpasRequest = {
  satpas_id: string;
} & Partial<Omit<Satpas, 'satpas_id' | 'created_at'>>;

/**
 * Request untuk mengambil detail Satpas berdasarkan ID.
 */
export type GetSatpasRequest = {
  satpas_id: string;
};

/**
 * Request untuk menghapus Satpas berdasarkan ID.
 */
export type DeleteSatpasRequest = {
  satpas_id: string;
};

/**
 * Struktur response umum untuk data Satpas.
 */
export type SatpasResponse = Omit<Satpas, 'created_at' | 'updated_at'> & {
  created_at: string;
  updated_at: string;
};

/**
 * Mengubah instance model Satpas menjadi objek response yang konsisten.
 *
 * @param {Satpas} satpas - Objek Satpas dari database.
 * @returns {SatpasResponse} - Representasi Satpas yang siap dikirim sebagai response.
 */
export function toSatpasResponse(satpas: Satpas): SatpasResponse {
  return {
    satpas_id: satpas.satpas_id,
    name: satpas.name,
    latitude: satpas.latitude,
    longitude: satpas.longitude,
    created_at: moment(satpas.created_at)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY HH:mm:ss'),
    updated_at: moment(satpas.updated_at)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY HH:mm:ss')
  };
}
