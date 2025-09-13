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

    jenisSim: z.enum(Object.values(JenisSIM) as [string, ...string[]], {
      message: 'Jenis SIM tidak valid'
    }),

    tanggalTerbit: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .transform((str) => new Date(str))
      .refine(
        (date) => date <= new Date(),
        'Tanggal terbit tidak boleh di masa depan'
      ),

    tanggalExpired: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
      .transform((str) => new Date(str))
      .refine(
        (date) => date > new Date(),
        'Tanggal expired harus di masa depan'
      ),

    ktpId: z
      .string()
      .min(1, 'KTP ID harus diisi')
      .max(21, 'KTP ID maksimal 21 karakter')
  };

  /**
   * Validasi saat membuat SIM baru.
   */
  static readonly CREATE = z
    .object({
      nomor_sim: this.baseSchemas.nomorSim,
      jenis_sim: this.baseSchemas.jenisSim,
      tanggal_terbit: this.baseSchemas.tanggalTerbit,
      tanggal_expired: this.baseSchemas.tanggalExpired,
      ktp_id: this.baseSchemas.ktpId
    })
    .refine((data) => data.tanggal_expired > data.tanggal_terbit, {
      message: 'Tanggal expired harus setelah tanggal terbit',
      path: ['tanggal_expired']
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
  static readonly UPDATE = z
    .object({
      sim_id: this.baseSchemas.simId,
      nomor_sim: this.baseSchemas.nomorSim.optional(),
      jenis_sim: this.baseSchemas.jenisSim.optional(),
      tanggal_terbit: this.baseSchemas.tanggalTerbit.optional(),
      tanggal_expired: this.baseSchemas.tanggalExpired.optional()
    })
    .refine(
      (data) => {
        if (data.tanggal_terbit && data.tanggal_expired) {
          return data.tanggal_expired > data.tanggal_terbit;
        }
        return true;
      },
      {
        message: 'Tanggal expired harus setelah tanggal terbit',
        path: ['tanggal_expired']
      }
    );

  /**
   * Validasi saat menghapus SIM berdasarkan ID.
   */
  static readonly DELETE = z.object({
    sim_id: this.baseSchemas.simId
  });

  /**
   * Validasi saat mencari SIM berdasarkan nomor SIM.
   */
  static readonly FIND_BY_NOMOR = z.object({
    nomor_sim: this.baseSchemas.nomorSim
  });

  /**
   * Validasi saat mengambil SIM berdasarkan KTP ID.
   */
  static readonly GET_BY_KTP = z.object({
    ktp_id: this.baseSchemas.ktpId
  });
}
