import { ZodType } from 'zod';

/**
 * Utility class untuk validasi data menggunakan Zod schema.
 */
export class Validation {
  /**
   * Melakukan validasi data terhadap schema Zod.
   *
   * @param {ZodType<T>} schema - Schema Zod yang digunakan untuk validasi.
   * @param {T} data - Data yang akan divalidasi.
   * @returns {T} - Data yang sudah tervalidasi (atau throw error jika tidak valid).
   */
  static validate<T>(schema: ZodType<T>, data: unknown): T {
    return schema.parse(data);
  }
}
