/* eslint-disable @typescript-eslint/no-explicit-any */
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
// JWT Configuration dari environment variables
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Membuat JWT access token menggunakan secret dari environment.
 *
 * @param {object} payload - Data payload yang akan disisipkan ke dalam token.
 * @param {jwt.SignOptions} [options] - Opsi tambahan seperti expiresIn, issuer, dsb.
 * @returns {string} Token JWT hasil sign.
 */
export const signAccessToken = (
  payload: object,
  options?: jwt.SignOptions
): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
    ...(options ?? {})
  });
};

/**
 * Membuat JWT refresh token menggunakan secret khusus refresh.
 *
 * @param {object} payload - Data payload yang akan disisipkan ke dalam token.
 * @param {jwt.SignOptions} [options] - Opsi tambahan seperti expiresIn, issuer, dsb.
 * @returns {string} Token JWT hasil sign.
 */
export const signRefreshToken = (
  payload: object,
  options?: jwt.SignOptions
): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
    ...(options && options)
  });
};

/**
 * Memverifikasi JWT access token.
 *
 * @param {string} token - Token yang akan diverifikasi.
 * @returns {{
 *   valid: boolean;
 *   expired: boolean;
 *   decoded: string | jwt.JwtPayload | null;
 *   errorMessage?: string;
 * }} Hasil verifikasi token.
 */
export const verifyAccessToken = (
  token: string
): {
  valid: boolean;
  expired: boolean;
  decoded: string | jwt.JwtPayload | null;
  errorMessage?: string;
} => {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    return {
      valid: true,
      expired: false,
      decoded
    };
  } catch (error: any) {
    return {
      valid: false,
      expired: error.message === 'jwt expired',
      errorMessage: error.message,
      decoded: null
    };
  }
};

/**
 * Memverifikasi JWT refresh token.
 *
 * @param {string} token - Token yang akan diverifikasi.
 * @returns {{
 *   valid: boolean;
 *   expired: boolean;
 *   decoded: string | jwt.JwtPayload | null;
 *   errorMessage?: string;
 * }} Hasil verifikasi token.
 */
export const verifyRefreshToken = (
  token: string
): {
  valid: boolean;
  expired: boolean;
  decoded: string | jwt.JwtPayload | null;
  errorMessage?: string;
} => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    return {
      valid: true,
      expired: false,
      decoded
    };
  } catch (error: any) {
    return {
      valid: false,
      expired: error.message === 'jwt expired',
      errorMessage: error.message,
      decoded: null
    };
  }
};
