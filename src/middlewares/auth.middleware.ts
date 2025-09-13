import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UserRequest } from '../types/request.type';
import { ResponseError } from '../utils/responseError';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

/**
 * Middleware untuk mendeserialisasi token JWT dari header Authorization.
 * Jika token valid, data user akan disimpan di req.user.
 *
 * @param req Request Express (UserRequest)
 * @param res Response Express
 * @param next NextFunction
 * @returns Melanjutkan ke middleware berikutnya atau mengembalikan error jika token tidak valid.
 */
export const deserializeToken = (
  req: UserRequest,
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

    if (
      typeof jwtPayload.user_id !== 'string' ||
      (typeof jwtPayload.is_active !== 'boolean' &&
        typeof jwtPayload.is_active !== 'number') ||
      typeof jwtPayload.email !== 'string' ||
      typeof jwtPayload.full_name !== 'string'
    ) {
      return next(
        new ResponseError(
          StatusCodes.FORBIDDEN,
          'Format payload token tidak valid.'
        )
      );
    }

    req.user = {
      user_id: jwtPayload.user_id,
      email: jwtPayload.email,
      full_name: jwtPayload.full_name,
      is_active: Boolean(jwtPayload.is_active)
    };

    next();
  } catch (error) {
    return next(error);
  }
};
