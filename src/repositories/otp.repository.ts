import db from '../configs/database';
import { hashing, compareHashedData } from '../utils/hashing';

export interface OTPCode {
  id: number;
  phone_number: string;
  otp_code: string;
  expires_at: Date;
  is_used: boolean;
  attempts: number;
  created_at: Date;
}

export class OTPRepository {
  /**
   * Simpan OTP baru ke database
   */
  async createOTP(
    phoneNumber: string,
    otpCode: string,
    expiresInMinutes: number = 5
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // Hash OTP sebelum disimpan ke database
    const hashedOTP = await hashing(otpCode);

    await db('otp_codes').insert({
      phone_number: phoneNumber,
      otp_code: hashedOTP,
      expires_at: expiresAt,
      is_used: false,
      attempts: 0
    });
  }

  /**
   * Verifikasi OTP
   */
  async verifyOTP(phoneNumber: string, otpCode: string): Promise<boolean> {
    // Ambil semua OTP yang belum digunakan dan belum expired untuk nomor ini
    const otpRecords = await db('otp_codes')
      .where({
        phone_number: phoneNumber,
        is_used: false
      })
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc');

    if (!otpRecords || otpRecords.length === 0) {
      return false;
    }

    // Cari OTP yang cocok dengan compare hash
    let foundMatch = false;
    for (const otp of otpRecords) {
      const isValid = await compareHashedData(otpCode, otp.otp_code);
      if (isValid) {
        // Mark OTP sebagai sudah digunakan
        await db('otp_codes').where({ id: otp.id }).update({
          is_used: true
        });
        foundMatch = true;
        break;
      }
    }

    // Jika tidak match, increment attempts untuk semua OTP aktif nomor ini
    if (!foundMatch) {
      await this.incrementAttempts(phoneNumber);
    }

    return foundMatch;
  }

  /**
   * Increment attempts untuk rate limiting
   */
  async incrementAttempts(phoneNumber: string): Promise<void> {
    await db('otp_codes')
      .where({ phone_number: phoneNumber, is_used: false })
      .where('expires_at', '>', new Date())
      .increment('attempts', 1);
  }

  /**
   * Cek berapa kali user request OTP dalam periode tertentu (rate limiting)
   */
  async countRecentOTPRequests(
    phoneNumber: string,
    minutesAgo: number = 60
  ): Promise<number> {
    const since = new Date();
    since.setMinutes(since.getMinutes() - minutesAgo);

    const result = await db('otp_codes')
      .where({ phone_number: phoneNumber })
      .where('created_at', '>', since)
      .count('* as count')
      .first();

    return result ? Number(result.count) : 0;
  }

  /**
   * Hapus OTP yang sudah expired (cleanup job)
   */
  async deleteExpiredOTPs(): Promise<number> {
    return await db('otp_codes')
      .where('expires_at', '<', new Date())
      .orWhere('is_used', true)
      .delete();
  }

  /**
   * Invalidate semua OTP aktif untuk nomor telepon tertentu
   */
  async invalidateOTPs(phoneNumber: string): Promise<void> {
    await db('otp_codes')
      .where({ phone_number: phoneNumber, is_used: false })
      .update({ is_used: true });
  }

  /**
   * Cek apakah OTP sudah melebihi max attempts
   */
  async hasExceededMaxAttempts(
    phoneNumber: string,
    maxAttempts: number = 5
  ): Promise<boolean> {
    const otp = await db('otp_codes')
      .where({
        phone_number: phoneNumber,
        is_used: false
      })
      .where('expires_at', '>', new Date())
      .where('attempts', '>=', maxAttempts)
      .first();

    return !!otp;
  }

  /**
   * Get current attempts count untuk nomor telepon
   */
  async getCurrentAttempts(phoneNumber: string): Promise<number> {
    const otp = await db('otp_codes')
      .where({
        phone_number: phoneNumber,
        is_used: false
      })
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc')
      .first();

    return otp ? otp.attempts : 0;
  }
}
