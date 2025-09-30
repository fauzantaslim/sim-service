import { Request, Response } from 'express';
import { AuthRepository } from '../repositories/auth.repository';
import { SessionRepository } from '../repositories/session.repository';
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
  UserResponse,
  toUserResponse
} from '../types/user.type';
import { compareHashedData, hashing } from '../utils/hashing';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger';

/**
 * Service untuk menangani business logic autentikasi.
 */
export class AuthService {
  private authRepository: AuthRepository;
  private sessionRepository: SessionRepository;

  constructor() {
    this.authRepository = new AuthRepository();
    this.sessionRepository = new SessionRepository();
  }

  /**
   * Melakukan login user.
   */
  async login(
    request: LoginRequest,
    user_agent?: string,
    ip_address?: string,
    req?: Request,
    res?: Response
  ): Promise<LoginResponse> {
    const { email, password } = request;

    logger.info({
      email,
      user_agent,
      ip_address,
      message: 'Login attempt started'
    });

    // Cari user berdasarkan email
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      logger.warn({
        email,
        ip_address,
        message: 'Login failed: User not found'
      });
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Email atau password salah'
      );
    }

    // Cek apakah user aktif
    if (!user.is_active) {
      logger.warn({
        user_id: user.user_id,
        email,
        ip_address,
        message: 'Login failed: User account inactive'
      });
      throw new ResponseError(
        StatusCodes.FORBIDDEN,
        'Akun Anda tidak aktif. Silakan hubungi administrator.'
      );
    }

    // Verifikasi password
    const isPasswordValid = await compareHashedData(password, user.password);
    if (!isPasswordValid) {
      logger.warn({
        user_id: user.user_id,
        email,
        ip_address,
        message: 'Login failed: Invalid password'
      });
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Email atau password salah'
      );
    }

    // Generate JWT access token
    const accessToken = signAccessToken({
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active
    });

    // Generate refresh token
    const refreshToken = signRefreshToken({
      user_id: user.user_id,
      session_type: 'web'
    });

    // Hash refresh token sebelum disimpan ke database
    const hashedRefreshToken = await hashing(refreshToken);

    // Set expires at untuk refresh token (7 hari)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Set expires at untuk refresh token (5 menit)
    // const expiresAt = new Date();
    // expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Buat session di database
    await this.sessionRepository.create({
      refresh_token: hashedRefreshToken,
      expires_at: expiresAt,
      user_agent: user_agent || undefined,
      ip_address: ip_address || undefined,
      user_id: user.user_id
    });

    // Update last login
    await this.authRepository.updateLastLogin(user.user_id);

    // Generate CSRF token
    let csrfToken = '';
    if (req && res) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const generateCsrfToken = (req.app as any).locals.generateToken;
      if (generateCsrfToken) {
        csrfToken = generateCsrfToken(req, res);
        logger.info({
          user_id: user.user_id,
          email,
          ip_address,
          csrf_token: csrfToken,
          csrf_token_length: csrfToken.length,
          message: 'CSRF token generated for user'
        });
      } else {
        logger.error({
          user_id: user.user_id,
          email,
          ip_address,
          message:
            'CSRF token generation failed - generateToken function not found'
        });
      }
    } else {
      logger.warn({
        user_id: user.user_id,
        email,
        ip_address,
        message: 'CSRF token generation skipped - req or res not available'
      });
    }

    // Set refresh token cookie jika response object tersedia
    if (res) {
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari dalam milliseconds
        // maxAge: 5 * 60 * 1000, // 1 menit dalam milliseconds
        path: '/'
      });
    }

    // Return response
    const userResponse: UserResponse = toUserResponse(user);

    logger.info({
      user_id: user.user_id,
      email,
      ip_address,
      user_agent,
      message: 'Login successful'
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
  async logout(userId: string): Promise<LogoutResponse> {
    logger.info({
      user_id: userId,
      message: 'Logout attempt started'
    });

    // Revoke semua session user
    const revokedCount = await this.sessionRepository.revokeByUserId(userId);

    logger.info({
      user_id: userId,
      revoked_sessions: revokedCount,
      message: 'Logout successful'
    });

    return {
      message: `Logout berhasil. ${revokedCount} session telah di-revoke`
    };
  }

  /**
   * Refresh access token menggunakan refresh token.
   */
  async refreshToken(
    refreshToken: string,
    req?: Request,
    res?: Response
  ): Promise<RefreshTokenResponse> {
    logger.info({
      message: 'Refresh token attempt started'
    });

    // Cari session berdasarkan refresh token yang di-hash
    const session =
      await this.sessionRepository.findByHashedRefreshToken(refreshToken);
    if (!session) {
      logger.warn({
        message: 'Refresh token failed: Invalid or expired token'
      });
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Refresh token tidak valid atau sudah expired'
      );
    }

    // Cari user berdasarkan user_id dari session
    const user = await this.authRepository.findById(session.user_id);
    if (!user) {
      logger.warn({
        user_id: session.user_id,
        message: 'Refresh token failed: User not found'
      });
      throw new ResponseError(StatusCodes.UNAUTHORIZED, 'User tidak ditemukan');
    }

    // Cek apakah user masih aktif
    if (!user.is_active) {
      logger.warn({
        user_id: user.user_id,
        message: 'Refresh token failed: User account inactive'
      });
      throw new ResponseError(StatusCodes.FORBIDDEN, 'Akun Anda tidak aktif');
    }

    // Generate access token baru
    const accessToken = signAccessToken({
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active
    });

    // Generate CSRF token baru
    let csrfToken = '';
    if (req && res) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const generateCsrfToken = (req.app as any).locals.generateToken;
      if (generateCsrfToken) {
        csrfToken = generateCsrfToken(req, res);
        logger.info({
          user_id: user.user_id,
          csrf_token: csrfToken,
          message: 'CSRF token generated during refresh'
        });
      } else {
        logger.error({
          user_id: user.user_id,
          message:
            'CSRF token generation failed during refresh - generateToken function not found'
        });
      }
    }

    // Return response dengan access token dan CSRF token
    const userResponse: UserResponse = toUserResponse(user);

    logger.info({
      user_id: user.user_id,
      message: 'Refresh token successful'
    });

    return {
      tokens: {
        access_token: accessToken,
        csrf_token: csrfToken
      },
      user: userResponse
    };
  }

  /**
   * Memvalidasi token dan mengembalikan data user.
   */
  async validateToken(userId: string): Promise<UserResponse> {
    logger.info({
      user_id: userId,
      message: 'Token validation started'
    });

    const user = await this.authRepository.findById(userId);
    if (!user) {
      logger.warn({
        user_id: userId,
        message: 'Token validation failed: User not found'
      });
      throw new ResponseError(StatusCodes.UNAUTHORIZED, 'User tidak ditemukan');
    }

    if (!user.is_active) {
      logger.warn({
        user_id: userId,
        message: 'Token validation failed: User account inactive'
      });
      throw new ResponseError(StatusCodes.FORBIDDEN, 'Akun Anda tidak aktif');
    }

    logger.info({
      user_id: userId,
      message: 'Token validation successful'
    });

    return toUserResponse(user);
  }
}
