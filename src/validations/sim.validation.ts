import { z } from 'zod';
import { JenisSIM } from '../models/sim.model';

/**
 * Schema validasi untuk operasi terkait SIM.
 * Menggunakan Zod untuk memvalidasi input.
 */
export class SIMValidation {
  /**
   * Base schema untuk field SIM yang sering digunakan
   */
  private static readonly baseSchemas = {
    simId: z
      .string()
      .min(1, 'SIM ID harus diisi')
      .max(21, 'SIM ID maksimal 21 karakter'),

    nomorSim: z
      .string()
      .length(16, 'Nomor SIM harus tepat 16 digit')
      .regex(/^\d{16}$/, 'Nomor SIM harus berupa 16 digit angka'),

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

  /**
   * Validasi saat membuat SIM baru.
   */
  static readonly CREATE = z.object({
    nomor_sim: this.baseSchemas.nomorSim,
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
  });

  /**
   * Validasi saat mengambil detail SIM berdasarkan ID.
   */
  static readonly GET = z.object({
    sim_id: this.baseSchemas.simId
  });

  /**
   * Validasi saat memperbarui SIM.
   */
  static readonly UPDATE = z.object({
    sim_id: this.baseSchemas.simId,
    nomor_sim: this.baseSchemas.nomorSim.optional(),
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
  });

  /**
   * Validasi saat menghapus SIM berdasarkan ID.
   */
  static readonly DELETE = z.object({
    sim_id: this.baseSchemas.simId
  });
}
