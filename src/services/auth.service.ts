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
    ip_address?: string
  ): Promise<LoginResponse> {
    const { email, password } = request;

    // Cari user berdasarkan email
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Email atau password salah'
      );
    }

    // Cek apakah user aktif
    if (!user.is_active) {
      throw new ResponseError(
        StatusCodes.FORBIDDEN,
        'Akun Anda tidak aktif. Silakan hubungi administrator.'
      );
    }

    // Verifikasi password
    const isPasswordValid = await compareHashedData(password, user.password);
    if (!isPasswordValid) {
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

    // Return response
    const userResponse: UserResponse = toUserResponse(user);

    return {
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken
      },
      user: userResponse
    };
  }

  /**
   * Melakukan logout user.
   */
  async logout(userId: string): Promise<LogoutResponse> {
    // Revoke semua session user
    const revokedCount = await this.sessionRepository.revokeByUserId(userId);

    return {
      message: `Logout berhasil. ${revokedCount} session telah di-revoke`
    };
  }

  /**
   * Refresh access token menggunakan refresh token.
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    // Cari session berdasarkan refresh token yang di-hash
    const session =
      await this.sessionRepository.findByHashedRefreshToken(refreshToken);
    if (!session) {
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Refresh token tidak valid atau sudah expired'
      );
    }

    // Cari user berdasarkan user_id dari session
    const user = await this.authRepository.findById(session.user_id);
    if (!user) {
      throw new ResponseError(StatusCodes.UNAUTHORIZED, 'User tidak ditemukan');
    }

    // Cek apakah user masih aktif
    if (!user.is_active) {
      throw new ResponseError(StatusCodes.FORBIDDEN, 'Akun Anda tidak aktif');
    }

    // Generate access token baru
    const accessToken = signAccessToken({
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active
    });

    // Return response dengan access token baru saja
    const userResponse: UserResponse = toUserResponse(user);

    return {
      tokens: {
        access_token: accessToken
      },
      user: userResponse
    };
  }

  /**
   * Memvalidasi token dan mengembalikan data user.
   */
  async validateToken(userId: string): Promise<UserResponse> {
    const user = await this.authRepository.findById(userId);
    if (!user) {
      throw new ResponseError(StatusCodes.UNAUTHORIZED, 'User tidak ditemukan');
    }

    if (!user.is_active) {
      throw new ResponseError(StatusCodes.FORBIDDEN, 'Akun Anda tidak aktif');
    }

    return toUserResponse(user);
  }
}
