import { z } from 'zod';

/**
 * Schema validasi untuk operasi terkait Pendaftaran SIM.
 */
export class PendaftaranSIMValidation {
  private static readonly baseSchemas = {
    pendaftaranId: z
      .string()
      .min(1, 'Pendaftaran ID harus diisi')
      .max(21, 'Pendaftaran ID maksimal 21 karakter'),

    satpasId: z
      .string()
      .min(1, 'Satpas ID harus diisi')
      .max(21, 'Satpas ID maksimal 21 karakter'),

    jenisSim: z.enum([
      'a',
      'a_umum',
      'bi',
      'bi_umum',
      'bii',
      'bii_umum',
      'c',
      'ci',
      'cii',
      'd',
      'di'
    ]),

    tanggalUjian: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal ujian harus YYYY-MM-DD')
      .refine(
        (date) => {
          const ujianDate = new Date(date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return ujianDate >= today;
        },
        { message: 'Tanggal ujian tidak boleh di masa lalu' }
      ),

    status: z.enum([
      'diajukan',
      'diperiksa',
      'disetujui',
      'proses_ujian',
      'ujian_gagal',
      'selesai',
      'ditolak'
    ])
  };

  static readonly CREATE = z.object({
    satpas_id: this.baseSchemas.satpasId,
    jenis_sim: this.baseSchemas.jenisSim,
    tanggal_ujian: this.baseSchemas.tanggalUjian
  });

  static readonly UPDATE_STATUS = z.object({
    pendaftaran_id: this.baseSchemas.pendaftaranId,
    status: this.baseSchemas.status
  });

  static readonly GET = z.object({
    pendaftaran_id: this.baseSchemas.pendaftaranId
  });

  static readonly DELETE = z.object({
    pendaftaran_id: this.baseSchemas.pendaftaranId
  });
}
