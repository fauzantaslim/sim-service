import { Admin } from '../models/admin';

/**
 * Request body untuk login admin.
 */
export type AdminLoginRequest = {
  email: string;
  password: string;
};

/**
 * Request untuk logout admin.
 */
export type AdminLogoutRequest = Record<string, never>;

/**
 * Request body untuk refresh token admin.
 */
export type AdminRefreshTokenRequest = {
  refresh_token: string;
};

/**
 * Struktur response umum untuk data admin (tanpa password).
 */
export type AdminResponse = Omit<Admin, 'password'>;

/**
 * Response untuk login admin yang berhasil.
 */
export type AdminLoginResponse = {
  tokens: {
    access_token: string;
    refresh_token: string;
    csrf_token: string;
  };
  admin: AdminResponse;
};

/**
 * Response untuk refresh token admin yang berhasil.
 */
export type AdminRefreshTokenResponse = {
  tokens: {
    access_token: string;
    csrf_token: string;
  };
  admin: AdminResponse;
};

/**
 * Response untuk logout admin yang berhasil.
 */
export type AdminLogoutResponse = {
  message: string;
};

/**
 * Mengubah instance model Admin menjadi objek response yang konsisten.
 *
 * @param {Admin} admin - Objek Admin dari database.
 * @returns {AdminResponse} - Representasi admin yang siap dikirim sebagai response.
 */
export function toAdminResponse(admin: Admin): AdminResponse {
  return {
    admin_id: admin.admin_id,
    email: admin.email,
    full_name: admin.full_name,
    created_at: admin.created_at,
    updated_at: admin.updated_at
  };
}
