import { z } from 'zod';

/**
 * Schema validasi untuk operasi terkait Admin.
 */
export class AdminValidation {
  private static readonly baseSchemas = {
    adminId: z
      .string()
      .min(1, 'Admin ID harus diisi')
      .max(21, 'Admin ID maksimal 21 karakter'),

    email: z
      .string()
      .min(1, 'Email harus diisi')
      .email('Format email tidak valid')
      .max(255, 'Email maksimal 255 karakter'),

    fullName: z
      .string()
      .min(1, 'Nama lengkap harus diisi')
      .max(255, 'Nama lengkap maksimal 255 karakter'),

    password: z
      .string()
      .min(6, 'Password minimal 6 karakter')
      .max(255, 'Password maksimal 255 karakter')
  };

  static readonly CREATE = z.object({
    email: this.baseSchemas.email,
    full_name: this.baseSchemas.fullName,
    password: this.baseSchemas.password
  });

  static readonly GET = z.object({
    admin_id: this.baseSchemas.adminId
  });

  static readonly UPDATE = z.object({
    admin_id: this.baseSchemas.adminId,
    email: this.baseSchemas.email.optional(),
    full_name: this.baseSchemas.fullName.optional(),
    password: this.baseSchemas.password.optional()
  });

  static readonly DELETE = z.object({
    admin_id: this.baseSchemas.adminId
  });
}
