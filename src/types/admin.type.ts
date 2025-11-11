import { Admin } from '../models/admin';
import moment from 'moment-timezone';

/**
 * Request untuk membuat Admin baru.
 */
export type CreateAdminRequest = {
  email: string;
  full_name: string;
  password: string;
};

/**
 * Request untuk memperbarui Admin.
 */
export type UpdateAdminRequest = {
  admin_id: string;
  email?: string;
  full_name?: string;
  password?: string;
};

/**
 * Request untuk mengambil detail Admin berdasarkan ID.
 */
export type GetAdminRequest = {
  admin_id: string;
};

/**
 * Request untuk menghapus Admin berdasarkan ID.
 */
export type DeleteAdminRequest = {
  admin_id: string;
};

/**
 * Struktur response umum untuk data Admin (tanpa password).
 */
export type AdminResponse = Omit<
  Admin,
  'password' | 'created_at' | 'updated_at'
> & {
  created_at: string;
  updated_at: string;
};

/**
 * Mengubah instance model Admin menjadi objek response yang konsisten.
 * Password tidak disertakan dalam response untuk keamanan.
 *
 * @param {Admin} admin - Objek Admin dari database.
 * @returns {AdminResponse} - Representasi Admin yang siap dikirim sebagai response.
 */
export function toAdminResponse(admin: Admin): AdminResponse {
  return {
    admin_id: admin.admin_id,
    email: admin.email,
    full_name: admin.full_name,
    created_at: moment(admin.created_at)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY HH:mm:ss'),
    updated_at: moment(admin.updated_at)
      .utc()
      .tz('Asia/Jakarta')
      .format('DD-MM-YYYY HH:mm:ss')
  };
}
