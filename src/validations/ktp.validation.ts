import { z } from 'zod';
import {
  JenisKelamin,
  Agama,
  StatusPerkawinan,
  GolonganDarah
} from '../models/ktp.model';

/**
 * Schema validasi untuk operasi terkait KTP.
 * Menggunakan Zod untuk memvalidasi input.
 */
export class KTPValidation {
  /**
   * Base schema untuk field KTP yang sering digunakan
   */
  private static readonly baseSchemas = {
    ktpId: z
      .string()
      .min(1, 'KTP ID harus diisi')
      .max(21, 'KTP ID maksimal 21 karakter'),

    nik: z
      .string()
      .length(16, 'NIK harus tepat 16 digit')
      .regex(/^\d{16}$/, 'NIK harus berupa 16 digit angka'),

    alamat: z
      .string()
      .min(1, 'Alamat harus diisi')
      .max(1000, 'Alamat maksimal 1000 karakter'),

    tempatLahir: z
      .string()
      .min(1, 'Tempat lahir harus diisi')
      .max(100, 'Tempat lahir maksimal 100 karakter'),

    tanggalLahir: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .transform((str) => new Date(str))
      .refine(
        (date) => date <= new Date(),
        'Tanggal lahir tidak boleh di masa depan'
      ),

    jenisKelamin: z.enum(Object.values(JenisKelamin) as [string, ...string[]], {
      message: 'Jenis kelamin tidak valid'
    }),

    agama: z.enum(Object.values(Agama) as [string, ...string[]], {
      message: 'Agama tidak valid'
    }),

    statusPerkawinan: z.enum(
      Object.values(StatusPerkawinan) as [string, ...string[]],
      {
        message: 'Status perkawinan tidak valid'
      }
    ),

    golDarah: z.enum(Object.values(GolonganDarah) as [string, ...string[]], {
      message: 'Golongan darah tidak valid'
    }),

    pekerjaan: z
      .string()
      .min(1, 'Pekerjaan harus diisi')
      .max(100, 'Pekerjaan maksimal 100 karakter'),

    kewarganegaraan: z
      .string()
      .min(1, 'Kewarganegaraan harus diisi')
      .max(50, 'Kewarganegaraan maksimal 50 karakter')
  };

  /**
   * Validasi saat membuat KTP baru.
   */
  static readonly CREATE = z.object({
    nik: this.baseSchemas.nik,
    alamat: this.baseSchemas.alamat,
    tempat_lahir: this.baseSchemas.tempatLahir,
    tanggal_lahir: this.baseSchemas.tanggalLahir,
    jenis_kelamin: this.baseSchemas.jenisKelamin,
    agama: this.baseSchemas.agama,
    status_perkawinan: this.baseSchemas.statusPerkawinan,
    gol_darah: this.baseSchemas.golDarah,
    pekerjaan: this.baseSchemas.pekerjaan,
    kewarganegaraan: this.baseSchemas.kewarganegaraan
  });

  /**
   * Validasi saat mengambil detail KTP berdasarkan ID.
   */
  static readonly GET = z.object({
    ktp_id: this.baseSchemas.ktpId
  });

  /**
   * Validasi saat memperbarui KTP.
   */
  static readonly UPDATE = z.object({
    ktp_id: this.baseSchemas.ktpId,
    nik: this.baseSchemas.nik.optional(),
    alamat: this.baseSchemas.alamat.optional(),
    tempat_lahir: this.baseSchemas.tempatLahir.optional(),
    tanggal_lahir: this.baseSchemas.tanggalLahir.optional(),
    jenis_kelamin: this.baseSchemas.jenisKelamin.optional(),
    agama: this.baseSchemas.agama.optional(),
    status_perkawinan: this.baseSchemas.statusPerkawinan.optional(),
    gol_darah: this.baseSchemas.golDarah.optional(),
    pekerjaan: this.baseSchemas.pekerjaan.optional(),
    kewarganegaraan: this.baseSchemas.kewarganegaraan.optional()
  });

  /**
   * Validasi saat menghapus KTP berdasarkan ID.
   */
  static readonly DELETE = z.object({
    ktp_id: this.baseSchemas.ktpId
  });

  /**
   * Validasi saat mencari KTP berdasarkan NIK.
   */
  static readonly FIND_BY_NIK = z.object({
    nik: this.baseSchemas.nik
  });
}
