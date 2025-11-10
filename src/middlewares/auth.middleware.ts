import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AuthRequest, Role, AuthPayload } from '../types/request.type';
import { ResponseError } from '../utils/responseError';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

/**
 * Middleware untuk mendeserialisasi token JWT dari header Authorization.
 * Jika token valid, data user akan disimpan di req.user.
 *
 * @param req Request Express (AuthRequest)
 * @param res Response Express
 * @param next NextFunction
 * @returns Melanjutkan ke middleware berikutnya atau mengembalikan error jika token tidak valid.
 */

/**
 * Memvalidasi payload token untuk admin.
 */
const validateAdminPayload = (payload: jwt.JwtPayload) => {
  return (
    typeof payload.admin_id === 'string' &&
    typeof payload.email === 'string' &&
    typeof payload.full_name === 'string'
  );
};

/**
 * Memvalidasi payload token untuk user.
 */
const validateUserPayload = (payload: jwt.JwtPayload) => {
  return (
    typeof payload.user_id === 'string' &&
    typeof payload.phone_number === 'string' &&
    (typeof payload.full_name === 'string' ||
      payload.full_name === null ||
      payload.full_name === undefined)
  );
};

export const deserializeToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = (req.headers as { authorization?: string }).authorization;

  if (Array.isArray(authHeader)) {
    // kalau entah kenapa ada multiple header
    return next(
      new ResponseError(
        StatusCodes.BAD_REQUEST,
        'Header Authorization tidak valid'
      )
    );
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new ResponseError(
        StatusCodes.UNAUTHORIZED,
        'Tidak diizinkan. Token tidak disediakan.'
      )
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const { valid, expired, errorMessage, decoded } = verifyAccessToken(token);

    if (expired) {
      return next(
        new ResponseError(
          StatusCodes.UNAUTHORIZED,
          'Token kadaluarsa. Silakan login kembali.'
        )
      );
    }

    if (!valid || !decoded || typeof decoded !== 'object') {
      return next(
        new ResponseError(
          StatusCodes.FORBIDDEN,
          `Token tidak valid. ${errorMessage || ''}`
        )
      );
    }

    const jwtPayload = decoded as jwt.JwtPayload;
    const { role } = jwtPayload as { role: Role };

    if (!role || (role !== 'admin' && role !== 'user')) {
      return next(
        new ResponseError(
          StatusCodes.FORBIDDEN,
          'Peran (role) dalam token tidak valid.'
        )
      );
    }

    let isValidPayload = false;
    if (role === 'admin') {
      isValidPayload = validateAdminPayload(jwtPayload);
    } else if (role === 'user') {
      isValidPayload = validateUserPayload(jwtPayload);
    }

    if (!isValidPayload) {
      return next(
        new ResponseError(
          StatusCodes.FORBIDDEN,
          'Format payload token tidak sesuai dengan perannya.'
        )
      );
    }

    req.auth = jwtPayload as AuthPayload;

    next();
  } catch (error) {
    return next(error);
  }
};
