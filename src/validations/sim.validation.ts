import { z } from 'zod';
import { JenisSIM } from '../models/sim.model';

/**
 * Fungsi untuk menghitung umur berdasarkan tanggal lahir
 */
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

/**
 * Fungsi untuk mendapatkan minimal umur berdasarkan jenis SIM
 */
function getMinimumAgeForSIMType(jenisSIM: string): number {
  switch (jenisSIM) {
    case JenisSIM.A:
    case JenisSIM.C:
    case JenisSIM.D:
    case JenisSIM.DI:
      return 17;
    case JenisSIM.A_UMUM:
    case JenisSIM.BI:
      return 20;
    case JenisSIM.BI_UMUM:
      return 22;
    case JenisSIM.BII:
      return 21;
    case JenisSIM.BII_UMUM:
      return 23;
    case JenisSIM.CI:
      return 18;
    case JenisSIM.CII:
      return 19;
    default:
      return Infinity; // agar dianggap tidak valid
  }
}

/**
 * Fungsi validasi umur, mengembalikan hasil + pesan error
 */
function validateAgeForSIMTypeWithMessage(
  birthDate: Date,
  jenisSIM: string
): { valid: boolean; message?: string } {
  const age = calculateAge(birthDate);
  const minAge = getMinimumAgeForSIMType(jenisSIM);

  if (age < minAge) {
    return {
      valid: false,
      message: `Umur saat ini ${age} tahun, minimal ${minAge} tahun untuk jenis SIM ${jenisSIM}`
    };
  }

  return { valid: true };
}

/**
 * Schema validasi untuk operasi terkait SIM.
 */
export class SIMValidation {
  private static readonly baseSchemas = {
    simId: z
      .string()
      .min(1, 'SIM ID harus diisi')
      .max(21, 'SIM ID maksimal 21 karakter'),

    fullName: z
      .string()
      .min(1, 'Nama lengkap harus diisi')
      .max(255, 'Nama lengkap maksimal 255 karakter'),

    nik: z
      .string()
      .length(16, 'NIK harus tepat 16 digit')
      .regex(/^\d{16}$/, 'NIK harus berupa 16 digit angka'),

    rt: z.string().min(1, 'RT harus diisi').max(3, 'RT maksimal 3 karakter'),
    rw: z.string().min(1, 'RW harus diisi').max(3, 'RW maksimal 3 karakter'),
    kecamatan: z
      .string()
      .min(1, 'Kecamatan harus diisi')
      .max(255, 'Kecamatan maksimal 255 karakter'),
    kabupaten: z
      .string()
      .min(1, 'Kabupaten harus diisi')
      .max(255, 'Kabupaten maksimal 255 karakter'),
    provinsi: z
      .string()
      .min(1, 'Provinsi harus diisi')
      .max(255, 'Provinsi maksimal 255 karakter'),
    jenisSim: z.enum(Object.values(JenisSIM) as [string, ...string[]], {
      message: 'Jenis SIM tidak valid'
    }),
    tanggalExpired: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .transform((str) => new Date(str))
      .refine(
        (date) => date > new Date(),
        'Tanggal expired harus di masa depan'
      ),
    jenisKelamin: z
      .string()
      .min(1, 'Jenis kelamin harus diisi')
      .max(20, 'Jenis kelamin maksimal 20 karakter'),
    golDarah: z
      .string()
      .min(1, 'Golongan darah harus diisi')
      .max(10, 'Golongan darah maksimal 10 karakter'),
    tempatLahir: z
      .string()
      .min(1, 'Tempat lahir harus diisi')
      .max(100, 'Tempat lahir maksimal 100 karakter'),
    tanggalLahir: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .transform((str) => new Date(str)),
    pekerjaan: z
      .string()
      .min(1, 'Pekerjaan harus diisi')
      .max(255, 'Pekerjaan maksimal 255 karakter'),
    picturePath: z
      .string()
      .min(1, 'Path foto harus diisi')
      .max(255, 'Path foto maksimal 255 karakter')
  };

  static readonly CREATE = z
    .object({
      full_name: this.baseSchemas.fullName,
      nik: this.baseSchemas.nik,
      rt: this.baseSchemas.rt,
      rw: this.baseSchemas.rw,
      kecamatan: this.baseSchemas.kecamatan,
      kabupaten: this.baseSchemas.kabupaten,
      provinsi: this.baseSchemas.provinsi,
      jenis_sim: this.baseSchemas.jenisSim,
      tanggal_expired: this.baseSchemas.tanggalExpired,
      jenis_kelamin: this.baseSchemas.jenisKelamin,
      gol_darah: this.baseSchemas.golDarah,
      tempat_lahir: this.baseSchemas.tempatLahir,
      tanggal_lahir: this.baseSchemas.tanggalLahir,
      pekerjaan: this.baseSchemas.pekerjaan,
      picture_path: this.baseSchemas.picturePath
    })
    .superRefine((data, ctx) => {
      const { valid, message } = validateAgeForSIMTypeWithMessage(
        data.tanggal_lahir,
        data.jenis_sim
      );
      if (!valid) {
        ctx.addIssue({
          path: ['tanggal_lahir'],
          code: z.ZodIssueCode.custom,
          message
        });
      }
    });

  static readonly GET = z.object({
    sim_id: this.baseSchemas.simId
  });

  static readonly UPDATE = z
    .object({
      sim_id: this.baseSchemas.simId,
      full_name: this.baseSchemas.fullName.optional(),
      nik: this.baseSchemas.nik.optional(),
      rt: this.baseSchemas.rt.optional(),
      rw: this.baseSchemas.rw.optional(),
      kecamatan: this.baseSchemas.kecamatan.optional(),
      kabupaten: this.baseSchemas.kabupaten.optional(),
      provinsi: this.baseSchemas.provinsi.optional(),
      jenis_sim: this.baseSchemas.jenisSim.optional(),
      tanggal_expired: this.baseSchemas.tanggalExpired.optional(),
      jenis_kelamin: this.baseSchemas.jenisKelamin.optional(),
      gol_darah: this.baseSchemas.golDarah.optional(),
      tempat_lahir: this.baseSchemas.tempatLahir.optional(),
      tanggal_lahir: this.baseSchemas.tanggalLahir.optional(),
      pekerjaan: this.baseSchemas.pekerjaan.optional(),
      picture_path: this.baseSchemas.picturePath.optional()
    })
    .superRefine((data, ctx) => {
      if (data.tanggal_lahir && data.jenis_sim) {
        const { valid, message } = validateAgeForSIMTypeWithMessage(
          data.tanggal_lahir,
          data.jenis_sim
        );
        if (!valid) {
          ctx.addIssue({
            path: ['tanggal_lahir'],
            code: z.ZodIssueCode.custom,
            message
          });
        }
      }
    });

  static readonly DELETE = z.object({
    sim_id: this.baseSchemas.simId
  });
}
