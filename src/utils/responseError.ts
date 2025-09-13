/**
 * Custom error class untuk menangani error dengan status HTTP dan pesan khusus.
 *
 * Biasanya digunakan untuk melempar error yang dapat dikembalikan ke client
 * dalam bentuk respons HTTP.
 *
 * @extends Error
 */
export class ResponseError extends Error {
  /**
   * Membuat instance ResponseError.
   *
   * @param {number} status - Kode status HTTP (misalnya 400, 404, 500).
   * @param {string} message - Pesan error yang menjelaskan detail kesalahan.
   */
  constructor(
    public status: number,
    public message: string
  ) {
    super(message);
  }
}
