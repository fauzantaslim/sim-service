import { z } from 'zod';

/**
 * Schema validasi untuk operasi terkait SIM.
 * SIM baru hanya memerlukan pendaftaran_id, tanggal terbit, dan tanggal expired.
 * Picture akan diupload via form-data.
 */
export class SIMValidation {
  private static readonly baseSchemas = {
    simId: z
      .string()
      .min(1, 'SIM ID harus diisi')
      .max(21, 'SIM ID maksimal 21 karakter'),

    pendaftaranId: z
      .string()
      .min(1, 'Pendaftaran ID harus diisi')
      .max(21, 'Pendaftaran ID maksimal 21 karakter'),

    tanggalTerbit: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .refine((str) => {
        const date = new Date(str);
        return !isNaN(date.getTime());
      }, 'Tanggal terbit tidak valid'),

    tanggalExpired: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .refine((str) => {
        const date = new Date(str);
        return !isNaN(date.getTime()) && date > new Date();
      }, 'Tanggal expired harus di masa depan')
  };

  static readonly CREATE = z.object({
    pendaftaran_id: this.baseSchemas.pendaftaranId,
    tanggal_terbit: this.baseSchemas.tanggalTerbit,
    tanggal_expired: this.baseSchemas.tanggalExpired
  });

  static readonly GET = z.object({
    sim_id: this.baseSchemas.simId
  });

  static readonly UPDATE = z.object({
    sim_id: this.baseSchemas.simId,
    tanggal_expired: this.baseSchemas.tanggalExpired.optional()
  });

  static readonly DELETE = z.object({
    sim_id: this.baseSchemas.simId
  });
}
