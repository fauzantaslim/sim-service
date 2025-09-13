import bcrypt from 'bcrypt';

/**
 * Meng-hash data plaintext (misalnya password, token, dll) menggunakan algoritma bcrypt.
 *
 * @param {string} data - Data plaintext yang ingin di-hash.
 * @returns {Promise<string>} Hasil hash dari data tersebut.
 */
export const hashing = async (data: string): Promise<string> => {
  return await bcrypt.hash(data, 10);
};

/**
 * Membandingkan data plaintext dengan data yang sudah di-hash.
 *
 * @param {string} plainData - Data plaintext yang akan dibandingkan.
 * @param {string} hashedData - Data yang sudah di-hash.
 * @returns {Promise<boolean>} `true` jika cocok, `false` jika tidak.
 */
export const compareHashedData = async (
  plainData: string,
  hashedData: string
): Promise<boolean> => {
  return await bcrypt.compare(plainData, hashedData);
};
