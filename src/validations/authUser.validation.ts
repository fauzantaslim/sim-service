import { z } from 'zod';

/**
 * Schema validasi untuk operasi autentikasi pengguna (user).
 * Menggunakan Zod untuk memvalidasi input.
 */
export class AuthUserValidation {
  /**
   * Base schema untuk field user yang sering digunakan
   */
  private static readonly baseSchemas = {
    phone_number: z
      .string()
      .min(10, 'Nomor telepon minimal 10 karakter')
      .max(15, 'Nomor telepon maksimal 15 karakter')
      .regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, {
        message: 'Format nomor telepon tidak valid'
      }),

    pin: z
      .string()
      .length(6, 'PIN harus 6 digit')
      .regex(/^[0-9]+$/, 'PIN hanya boleh berisi angka'),

    refreshToken: z
      .string()
      .min(1, 'Refresh token harus diisi')
      .max(1000, 'Refresh token maksimal 1000 karakter')
  };

  /**
   * Validasi untuk registrasi user (hanya nomor telepon).
   */
  static readonly REGISTER = z.object({
    phone_number: this.baseSchemas.phone_number
  });

  /**
   * Validasi untuk verifikasi OTP.
   */
  static readonly VERIFY_OTP = z.object({
    phone_number: this.baseSchemas.phone_number,
    otp: z
      .string()
      .length(6, 'OTP harus 6 karakter')
      .regex(/^[a-zA-Z0-9]+$/, 'OTP hanya boleh berisi huruf dan angka')
  });

  /**
   * Validasi untuk set PIN.
   */
  static readonly SET_PIN = z.object({
    user_id: z.string().min(1, 'User ID harus diisi'),
    pin: this.baseSchemas.pin
  });

  /**
   * Validasi untuk login user.
   */
  static readonly LOGIN = z.object({
    phone_number: this.baseSchemas.phone_number,
    pin: this.baseSchemas.pin
  });

  /**
   * Validasi untuk logout user.
   */
  static readonly LOGOUT = z.object({
    // Logout tidak memerlukan body, hanya token dari header
  });

  /**
   * Validasi untuk refresh token user.
   */
  static readonly REFRESH_TOKEN = z.object({
    refresh_token: this.baseSchemas.refreshToken
  });
}
