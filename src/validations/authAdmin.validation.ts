import { z } from 'zod';

/**
 * Schema validasi untuk operasi autentikasi admin.
 * Menggunakan Zod untuk memvalidasi input.
 */
export class AuthAdminValidation {
  /**
   * Base schema untuk field admin yang sering digunakan
   */
  private static readonly baseSchemas = {
    email: z
      .email('Format email tidak valid')
      .max(255, 'Email maksimal 255 karakter'),

    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .max(255, 'Password maksimal 255 karakter'),

    refreshToken: z
      .string()
      .min(1, 'Refresh token harus diisi')
      .max(1000, 'Refresh token maksimal 1000 karakter')
  };

  /**
   * Validasi untuk login admin.
   */
  static readonly LOGIN = z.object({
    email: this.baseSchemas.email,
    password: z
      .string()
      .min(1, 'Password harus diisi')
      .max(255, 'Password maksimal 255 karakter')
  });

  /**
   * Validasi untuk logout admin.
   */
  static readonly LOGOUT = z.object({
    // Logout tidak memerlukan body, hanya token dari header
  });

  /**
   * Validasi untuk refresh token admin.
   */
  static readonly REFRESH_TOKEN = z.object({
    refresh_token: this.baseSchemas.refreshToken
  });
}
