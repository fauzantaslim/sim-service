import { Request, Response } from 'express';
import { AuthAdminRepository } from '../repositories/authAdmin.repository';
import { SessionRepository } from '../repositories/session.repository';
import { compareHashedData, hashing } from '../utils/hashing';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
import logger from '../utils/logger';
import {
  AdminLoginRequest,
  AdminLoginResponse,
  AdminRefreshTokenResponse,
  AdminLogoutResponse,
  AdminResponse
} from '../types/authAdmin.type';
import { toAdminResponse } from '../types/authAdmin.type';

/**
 * Service untuk business logic autentikasi admin.
 */
export class AuthAdminService {
  private authRepository: AuthAdminRepository;
  private sessionRepository: SessionRepository;

  constructor() {
    this.authRepository = new AuthAdminRepository();
    this.sessionRepository = new SessionRepository();
  }

  async loginAdmin(
    request: AdminLoginRequest,
    user_agent?: string,
    ip_address?: string,
    req?: Request,
    res?: Response
  ): Promise<AdminLoginResponse> {
    const { email, password } = request;

    logger.info({
      email,
      user_agent,
      ip_address,
      message: 'Admin login attempt'
    });

    const admin = await this.authRepository.findByEmail(email);
    if (!admin) {
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Email atau password salah'
      );
    }

    const isPasswordValid = await compareHashedData(password, admin.password);
    if (!isPasswordValid) {
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Email atau password salah'
      );
    }

    const accessToken = signAccessToken({
      admin_id: admin.admin_id,
      email: admin.email,
      full_name: admin.full_name,
      role: 'admin'
    });

    const refreshToken = signRefreshToken({
      admin_id: admin.admin_id,
      session_type: 'admin'
    });

    const hashedRefreshToken = await hashing(refreshToken);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 50);

    await this.sessionRepository.create({
      refresh_token: hashedRefreshToken,
      expires_at: expiresAt,
      user_agent: user_agent || undefined,
      ip_address: ip_address || undefined,
      admin_id: admin.admin_id
    });

    await this.authRepository.updateLastLogin(admin.admin_id);

    let csrfToken = '';
    if (req && res) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const generateCsrfToken = (req.app as any).locals.generateToken;
      if (generateCsrfToken) {
        csrfToken = generateCsrfToken(req, res);
      }
    }

    if (res) {
      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 5 * 60 * 1000,
        path: '/'
      });
    }

    const adminResponse: AdminResponse = {
      admin_id: admin.admin_id,
      email: admin.email,
      full_name: admin.full_name,
      created_at: admin.created_at,
      updated_at: admin.updated_at
    };

    return {
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
        csrf_token: csrfToken
      },
      admin: adminResponse
    };
  }

  async logoutAdmin(adminId: string): Promise<AdminLogoutResponse> {
    const revokedCount = await this.sessionRepository.revokeByAdminId(adminId);
    return {
      message: `Logout berhasil. ${revokedCount} session telah di-revoke`
    };
  }

  async refreshTokenAdmin(
    refreshToken: string,
    req?: Request,
    res?: Response
  ): Promise<AdminRefreshTokenResponse> {
    const session =
      await this.sessionRepository.findByHashedRefreshToken(refreshToken);
    if (!session) {
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Refresh token tidak valid atau sudah expired'
      );
    }

    if (!session.admin_id) {
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Session bukan untuk admin'
      );
    }

    const admin = await this.authRepository.findById(session.admin_id);
    if (!admin) {
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Admin tidak ditemukan'
      );
    }

    const accessToken = signAccessToken({
      admin_id: admin.admin_id,
      email: admin.email,
      full_name: admin.full_name,
      role: 'admin'
    });

    let csrfToken = '';
    if (req && res) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const generateCsrfToken = (req.app as any).locals.generateToken;
      if (generateCsrfToken) {
        csrfToken = generateCsrfToken(req, res);
      }
    }

    return {
      tokens: {
        access_token: accessToken,
        csrf_token: csrfToken
      },
      admin: {
        admin_id: admin.admin_id,
        email: admin.email,
        full_name: admin.full_name,
        created_at: admin.created_at,
        updated_at: admin.updated_at
      }
    };
  }

  /**
   * Mengambil data admin yang sedang login.
   */
  async getMe(adminId: string) {
    const admin = await this.authRepository.findById(adminId);
    if (!admin) {
      throw new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Admin tidak ditemukan'
      );
    }
    return toAdminResponse(admin);
  }
}
