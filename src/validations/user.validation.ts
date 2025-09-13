import { z } from 'zod';

/**
 * Schema validasi untuk operasi terkait data pengguna (user).
 * Menggunakan Zod untuk memvalidasi input.
 */
export class UserValidation {
  /**
   * Base schema untuk field user yang sering digunakan
   */
  private static readonly baseSchemas = {
    email: z
      .email('Format email tidak valid')
      .max(255, 'Email maksimal 255 karakter'),

    fullName: z
      .string()
      .min(1, 'Nama lengkap harus diisi')
      .max(255, 'Nama lengkap maksimal 255 karakter'),

    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .max(255, 'Password maksimal 255 karakter'),

    userId: z
      .string()
      .min(1, 'User ID harus diisi')
      .max(21, 'User ID maksimal 21 karakter'),

    isActive: z.boolean()
  };

  /**
   * Validasi saat membuat data user baru.
   */
  static readonly CREATE = z.object({
    email: this.baseSchemas.email,
    full_name: this.baseSchemas.fullName,
    password: this.baseSchemas.password,
    is_active: this.baseSchemas.isActive.default(true)
  });

  /**
   * Validasi saat mengambil detail user berdasarkan ID.
   */
  static readonly GET = z.object({
    user_id: this.baseSchemas.userId
  });

  /**
   * Validasi saat memperbarui data user.
   */
  static readonly UPDATE = z.object({
    user_id: this.baseSchemas.userId,
    email: this.baseSchemas.email.optional(),
    full_name: this.baseSchemas.fullName.optional(),
    password: this.baseSchemas.password.optional(),
    is_active: this.baseSchemas.isActive.optional()
  });

  /**
   * Validasi saat menghapus data user berdasarkan ID.
   */
  static readonly DELETE = z.object({
    user_id: this.baseSchemas.userId
  });

  /**
   * Validasi untuk login user.
   */
  static readonly LOGIN = z.object({
    email: this.baseSchemas.email,
    password: z
      .string()
      .min(1, 'Password harus diisi')
      .max(255, 'Password maksimal 255 karakter')
  });

  /**
   * Validasi untuk logout user.
   */
  static readonly LOGOUT = z.object({
    // Logout tidak memerlukan body, hanya token dari header
  });
}
