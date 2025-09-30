/**
 * Utility functions untuk generate nomor SIM berdasarkan pola NIK.
 *
 * Format nomor SIM: PPKKCCDDMMYYSSSS (16 digit)
 * - PP: 2 digit kode provinsi
 * - KK: 2 digit kode kabupaten/kota
 * - CC: 2 digit kode kecamatan
 * - DDMMYY: tanggal lahir (DD + 40 untuk perempuan)
 * - SSSS: 4 digit nomor urut
 */

/**
 * Generate nomor SIM berdasarkan pola NIK (16 digit).
 *
 * @param nik - NIK pemilik SIM (16 digit)
 * @param jenisKelamin - Jenis kelamin ('laki_laki' atau 'perempuan')
 * @param tanggalLahir - Tanggal lahir pemilik SIM
 * @param nomorUrut - Nomor urut untuk menghindari duplikasi
 * @returns Nomor SIM yang digenerate (16 digit)
 *
 * @example
 * ```typescript
 * const nomorSIM = generateNomorSIM(
 *   '3201010101010001',
 *   'laki_laki',
 *   new Date('1990-01-01'),
 *   1
 * );
 * // Result: '3201010101900001'
 * ```
 */
export function generateNomorSIM(
  nik: string,
  jenisKelamin: string,
  tanggalLahir: Date,
  nomorUrut: number
): string {
  // Validasi input
  if (!nik || nik.length !== 16 || !/^\d{16}$/.test(nik)) {
    throw new Error('NIK harus berupa 16 digit angka');
  }

  if (
    !jenisKelamin ||
    !['laki_laki', 'perempuan'].includes(jenisKelamin.toLowerCase())
  ) {
    throw new Error('Jenis kelamin harus "laki_laki" atau "perempuan"');
  }

  if (!tanggalLahir || !(tanggalLahir instanceof Date)) {
    throw new Error('Tanggal lahir harus berupa objek Date yang valid');
  }

  if (!Number.isInteger(nomorUrut) || nomorUrut < 1 || nomorUrut > 9999) {
    throw new Error('Nomor urut harus berupa angka antara 1-9999');
  }

  // Ambil 6 digit pertama dari NIK (PPKKCC)
  const kodeWilayah = nik.substring(0, 6);

  // Format tanggal lahir
  const tanggal = tanggalLahir.getDate();
  const bulan = tanggalLahir.getMonth() + 1; // getMonth() returns 0-11
  const tahun = tanggalLahir.getFullYear() % 100; // Ambil 2 digit terakhir tahun

  // Untuk perempuan, tambahkan 40 pada tanggal
  const tanggalFormatted =
    jenisKelamin.toLowerCase() === 'perempuan'
      ? (tanggal + 40).toString().padStart(2, '0')
      : tanggal.toString().padStart(2, '0');

  const bulanFormatted = bulan.toString().padStart(2, '0');
  const tahunFormatted = tahun.toString().padStart(2, '0');

  // Format nomor urut (4 digit)
  const nomorUrutFormatted = nomorUrut.toString().padStart(4, '0');

  // Gabungkan semua bagian
  const nomorSIM = `${kodeWilayah}${tanggalFormatted}${bulanFormatted}${tahunFormatted}${nomorUrutFormatted}`;

  // Validasi hasil akhir
  if (nomorSIM.length !== 16) {
    throw new Error(
      `Generated SIM number length is invalid: ${nomorSIM.length}, expected 16`
    );
  }

  return nomorSIM;
}

/**
 * Parse nomor SIM untuk mendapatkan informasi yang tersimpan.
 *
 * @param nomorSIM - Nomor SIM (16 digit)
 * @returns Object berisi informasi yang tersimpan dalam nomor SIM
 *
 * @example
 * ```typescript
 * const info = parseNomorSIM('3201010101900001');
 * // Result: {
 * //   kodeWilayah: '320101',
 * //   tanggalLahir: { tanggal: 1, bulan: 1, tahun: 90 },
 * //   jenisKelamin: 'laki_laki',
 * //   nomorUrut: 1
 * // }
 * ```
 */
export function parseNomorSIM(nomorSIM: string): {
  kodeWilayah: string;
  tanggalLahir: { tanggal: number; bulan: number; tahun: number };
  jenisKelamin: 'laki_laki' | 'perempuan';
  nomorUrut: number;
} {
  // Validasi input
  if (!nomorSIM || nomorSIM.length !== 16 || !/^\d{16}$/.test(nomorSIM)) {
    throw new Error('Nomor SIM harus berupa 16 digit angka');
  }

  // Parse komponen
  const kodeWilayah = nomorSIM.substring(0, 6);
  const tanggalStr = nomorSIM.substring(6, 8);
  const bulanStr = nomorSIM.substring(8, 10);
  const tahunStr = nomorSIM.substring(10, 12);
  const nomorUrutStr = nomorSIM.substring(12, 16);

  const tanggal = parseInt(tanggalStr, 10);
  const bulan = parseInt(bulanStr, 10);
  const tahun = parseInt(tahunStr, 10);
  const nomorUrut = parseInt(nomorUrutStr, 10);

  // Tentukan jenis kelamin berdasarkan tanggal
  const jenisKelamin = tanggal > 40 ? 'perempuan' : 'laki_laki';
  const tanggalAsli = jenisKelamin === 'perempuan' ? tanggal - 40 : tanggal;

  return {
    kodeWilayah,
    tanggalLahir: {
      tanggal: tanggalAsli,
      bulan,
      tahun: 2000 + tahun // Asumsi tahun 2000-an
    },
    jenisKelamin,
    nomorUrut
  };
}

/**
 * Validasi format nomor SIM.
 *
 * @param nomorSIM - Nomor SIM yang akan divalidasi
 * @returns true jika format valid, false jika tidak
 */
export function isValidNomorSIM(nomorSIM: string): boolean {
  try {
    parseNomorSIM(nomorSIM);
    return true;
  } catch {
    return false;
  }
}
