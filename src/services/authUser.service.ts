import { Request, Response } from 'express';
import {
  UserRegisterRequest,
  UserVerifyOTPRequest,
  UserSetPinRequest,
  UserLoginRequest,
  UserLoginResponse,
  UserRefreshTokenResponse,
  UserLogoutResponse,
  UserResponse,
  toUserResponse
} from '../types/authUser.type';
import { sendWhatsAppOTP } from '../utils/whatsapp';
import { randomInt } from 'crypto';
import { AuthUserRepository } from '../repositories/authUser.repository';
import { SessionRepository } from '../repositories/session.repository';
import { OTPRepository } from '../repositories/otp.repository';
import { compareHashedData, hashing } from '../utils/hashing';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger';
import axios from 'axios';

/**
 * Service untuk menangani business logic autentikasi pengguna.
 */
export class AuthUserService {
  private authUserRepository: AuthUserRepository;
  private sessionRepository: SessionRepository;
  private otpRepository: OTPRepository;

  constructor() {
    this.authUserRepository = new AuthUserRepository();
    this.sessionRepository = new SessionRepository();
    this.otpRepository = new OTPRepository();
  }

  /**
   * Memulai proses registrasi user.
   */
  async registerUser(
    request: UserRegisterRequest
  ): Promise<{ message: string; has_pin: boolean; requires_otp: boolean }> {
    const { phone_number } = request;

    const existingUser =
      await this.authUserRepository.findByPhoneNumber(phone_number);

    // Jika user sudah ada dan sudah punya PIN, arahkan ke halaman login PIN
    if (existingUser && existingUser.pin) {
      logger.info(
        `User with phone number ${phone_number} already has PIN. Redirect to PIN login.`
      );
      return {
        message: 'Nomor telepon sudah terdaftar. Silakan masukkan PIN Anda.',
        has_pin: true,
        requires_otp: false
      };
    }

    // Jika user sudah ada tapi belum punya PIN, atau user baru
    if (!existingUser) {
      // Jika user belum ada, buat user baru hanya dengan nomor telepon
      await this.authUserRepository.createUser(phone_number);
      logger.info(`New user created with phone number: ${phone_number}`);
    }

    // Rate limiting: Cek berapa kali user request OTP dalam 1 jam terakhir
    const recentRequests = await this.otpRepository.countRecentOTPRequests(
      phone_number,
      60
    );
    if (recentRequests >= 5) {
      throw new ResponseError(
        StatusCodes.TOO_MANY_REQUESTS,
        'Terlalu banyak permintaan OTP. Silakan coba lagi nanti.'
      );
    }

    // Invalidate OTP lama yang belum digunakan
    await this.otpRepository.invalidateOTPs(phone_number);

    // Buat OTP (6 digit angka)
    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');

    // Simpan OTP ke database dengan masa berlaku 5 menit
    await this.otpRepository.createOTP(phone_number, otp, 5);

    // Kirim OTP via WhatsApp
    await sendWhatsAppOTP(phone_number, otp);

    logger.info(`OTP sent to ${phone_number}`);

    return {
      message: 'OTP berhasil dikirim ke nomor WhatsApp Anda',
      has_pin: false,
      requires_otp: true
    };
  }

  /**
   * Verifikasi OTP saja (tidak set PIN).
   */
  async verifyOTP(
    request: UserVerifyOTPRequest
  ): Promise<{ message: string; user_id: string }> {
    const { phone_number, otp } = request;

    // Cek apakah sudah melebihi max attempts
    const hasExceeded = await this.otpRepository.hasExceededMaxAttempts(
      phone_number,
      5
    );
    if (hasExceeded) {
      logger.warn({
        phone_number,
        message: 'OTP verification failed: Max attempts exceeded'
      });
      throw new ResponseError(
        StatusCodes.TOO_MANY_REQUESTS,
        'Terlalu banyak percobaan. Silakan request OTP baru.'
      );
    }

    // Verifikasi OTP
    const isValidOTP = await this.otpRepository.verifyOTP(phone_number, otp);
    if (!isValidOTP) {
      const currentAttempts =
        await this.otpRepository.getCurrentAttempts(phone_number);
      const remainingAttempts = Math.max(0, 5 - currentAttempts);

      logger.warn({
        phone_number,
        attempts: currentAttempts,
        remaining: remainingAttempts,
        message: 'OTP verification failed: Invalid or expired OTP'
      });

      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        `OTP tidak valid atau sudah kadaluarsa. Sisa percobaan: ${remainingAttempts}`
      );
    }

    // Cari user berdasarkan nomor telepon
    const user = await this.authUserRepository.findByPhoneNumber(phone_number);
    if (!user) {
      throw new ResponseError(StatusCodes.NOT_FOUND, 'User tidak ditemukan');
    }

    logger.info({
      user_id: user.user_id,
      phone_number,
      message: 'OTP verified successfully'
    });

    return {
      message: 'OTP berhasil diverifikasi',
      user_id: user.user_id
    };
  }

  /**
   * Set PIN untuk user setelah OTP terverifikasi.
   */
  async setPIN(
    request: UserSetPinRequest,
    userAgent?: string,
    ipAddress?: string,
    req?: Request,
    res?: Response
  ): Promise<UserLoginResponse> {
    const { user_id, pin } = request;

    // Cari user berdasarkan user_id
    const user = await this.authUserRepository.findById(user_id);
    if (!user) {
      throw new ResponseError(StatusCodes.NOT_FOUND, 'User tidak ditemukan');
    }

    // Cek apakah user sudah punya PIN
    if (user.pin) {
      throw new ResponseError(
        StatusCodes.BAD_REQUEST,
        'PIN sudah pernah di-set sebelumnya'
      );
    }

    // Hash PIN
    const hashedPin = await hashing(pin);

    // Update PIN user
    await this.authUserRepository.updateUser(user.user_id, {
      pin: hashedPin
    });

    // Ambil data user yang sudah diupdate
    const updatedUser = await this.authUserRepository.findById(user_id);
    if (!updatedUser) {
      throw new ResponseError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        'Gagal mengambil data user'
      );
    }

    // Generate tokens
    const accessToken = signAccessToken({
      user_id: updatedUser.user_id,
      phone_number: updatedUser.phone_number,
      full_name: updatedUser.full_name || null,
      role: 'user'
    });

    const refreshToken = signRefreshToken({
      user_id: updatedUser.user_id
    });

    const hashedRefreshToken = await hashing(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token berlaku 7 hari

    // Simpan session
    await this.sessionRepository.create({
      user_id: updatedUser.user_id,
      refresh_token: hashedRefreshToken,
      user_agent: userAgent || 'unknown',
      ip_address: ipAddress || 'unknown',
      expires_at: expiresAt
    });

    await this.authUserRepository.updateUserTimestamp(updatedUser.user_id);

    let csrfToken = '';
    if (req && res) {
      const generateCsrfToken = req.app.locals.generateToken;
      if (generateCsrfToken) {
        csrfToken = generateCsrfToken(req, res);
      }
    }

    const userResponse = toUserResponse(updatedUser);

    logger.info({
      user_id: updatedUser.user_id,
      message: 'PIN set successfully and user logged in'
    });

    return {
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        csrf_token: csrfToken
      },
      user: userResponse
    };
  }

  /**
   * Melakukan login user menggunakan nomor telepon dan PIN.
   */
  async loginUser(
    request: UserLoginRequest,
    userAgent?: string,
    ipAddress?: string,
    req?: Request,
    res?: Response
  ): Promise<UserLoginResponse> {
    const { phone_number, pin } = request;

    logger.info({
      phone_number,
      userAgent,
      ipAddress,
      message: 'User login attempt started'
    });

    const user = await this.authUserRepository.findByPhoneNumber(phone_number);
    if (!user || !user.pin) {
      logger.warn({
        phone_number,
        ipAddress,
        message: 'Login failed: User not found or PIN not set'
      });
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Nomor telepon atau PIN salah'
      );
    }

    const isPinValid = await compareHashedData(pin, user.pin);
    if (!isPinValid) {
      logger.warn({
        user_id: user.user_id,
        phone_number,
        ipAddress,
        message: 'Login failed: Invalid PIN'
      });
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Nomor telepon atau PIN salah'
      );
    }

    const accessToken = signAccessToken({
      user_id: user.user_id,
      phone_number: user.phone_number,
      full_name: user.full_name || null,
      role: 'user'
    });

    const refreshToken = signRefreshToken({
      user_id: user.user_id,
      session_type: 'web'
    });

    const hashedRefreshToken = await hashing(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token berlaku 7 hari

    await this.sessionRepository.create({
      refresh_token: hashedRefreshToken,
      expires_at: expiresAt,
      user_agent: userAgent,
      ip_address: ipAddress,
      user_id: user.user_id
    });

    await this.authUserRepository.updateUserTimestamp(user.user_id);

    let csrfToken = '';
    if (req && res) {
      const generateCsrfToken = req.app.locals.generateToken;
      if (generateCsrfToken) {
        csrfToken = generateCsrfToken(req, res);
      }
    }

    if (res) {
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
        path: '/'
      });
    }

    const userResponse: UserResponse = toUserResponse(user);

    logger.info({
      user_id: user.user_id,
      phone_number,
      ipAddress,
      userAgent,
      message: 'User login successful'
    });

    return {
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        csrf_token: csrfToken
      },
      user: userResponse
    };
  }

  /**
   * Melakukan logout user.
   */
  async logoutUser(userId: string): Promise<UserLogoutResponse> {
    const revokedCount = await this.sessionRepository.revokeByUserId(userId);
    logger.info({
      user_id: userId,
      revoked_sessions: revokedCount,
      message: 'User logout successful'
    });
    return {
      message: `Logout berhasil. ${revokedCount} session telah di-revoke`
    };
  }

  /**
   * Refresh access token untuk user.
   */
  async refreshToken(
    refreshToken: string,
    req?: Request,
    res?: Response
  ): Promise<UserRefreshTokenResponse> {
    const session =
      await this.sessionRepository.findByHashedRefreshToken(refreshToken);
    if (!session || !session.user_id) {
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Refresh token tidak valid atau sudah kedaluwarsa'
      );
    }

    const user = await this.authUserRepository.findById(session.user_id);
    if (!user) {
      throw new ResponseError(StatusCodes.UNAUTHORIZED, 'User tidak ditemukan');
    }

    const accessToken = signAccessToken({
      user_id: user.user_id,
      phone_number: user.phone_number,
      full_name: user.full_name || null,
      role: 'user'
    });

    let csrfToken = '';
    if (req && res) {
      const generateCsrfToken = req.app.locals.generateToken;
      if (generateCsrfToken) {
        csrfToken = generateCsrfToken(req, res);
      }
    }

    const userResponse: UserResponse = toUserResponse(user);

    return {
      tokens: {
        access_token: accessToken,
        csrf_token: csrfToken
      },
      user: userResponse
    };
  }

  /**
   * Mengambil data user yang sedang login.
   */
  async getMe(userId: string): Promise<UserResponse> {
    const user = await this.authUserRepository.findById(userId);
    if (!user) {
      throw new ResponseError(StatusCodes.UNAUTHORIZED, 'User tidak ditemukan');
    }
    return toUserResponse(user);
  }

  async verifyNIK(
    userId: string,
    nik: string
  ): Promise<{ message: string; user: UserResponse }> {
    const user = await this.authUserRepository.findById(userId);
    if (!user) {
      throw new ResponseError(StatusCodes.UNAUTHORIZED, 'User tidak ditemukan');
    }

    try {
      const url = `https://ktp.chasouluix.biz.id/api/ktp/nik/${encodeURIComponent(
        nik
      )}`;
      const resp = await axios.get(url);
      if (resp.status !== 200 || !resp.data || resp.data.success !== true) {
        logger.warn({
          url,
          nik,
          status: resp.status,
          message: 'NIK verification failed'
        });
        throw new ResponseError(
          StatusCodes.UNPROCESSABLE_ENTITY,
          'NIK tidak ditemukan atau tidak valid'
        );
      }

      await this.authUserRepository.updateUser(userId, { nik });

      const updatedUser = await this.authUserRepository.findById(userId);
      if (!updatedUser) {
        throw new ResponseError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Gagal memperbarui NIK user'
        );
      }

      logger.info({ user_id: userId, nik, message: 'NIK verified and saved' });
      return {
        message: 'NIK berhasil diverifikasi dan disimpan',
        user: toUserResponse(updatedUser)
      };
    } catch (error) {
      if (error instanceof ResponseError) throw error;
      logger.error({ error, message: 'Error during NIK verification' });
      throw new ResponseError(
        StatusCodes.BAD_GATEWAY,
        'Layanan verifikasi NIK tidak tersedia. Coba lagi nanti.'
      );
    }
  }
}
