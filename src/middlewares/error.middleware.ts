import { Response, Request, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ResponseError } from '../utils/responseError';
import { StatusCodes } from 'http-status-codes';
/**
 * Middleware global untuk menangani error pada aplikasi Express.
 * Menangani error dari Zod, ResponseError, dan error umum lain.
 *
 * @param error Error yang dilempar dari middleware/controller lain
 * @param req Request Express
 * @param res Response Express
 * @param next NextFunction
 * @returns Response JSON dengan status dan pesan error yang sesuai
 */
export const errorMiddleware = async (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  if (error instanceof ZodError) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      status_code: StatusCodes.BAD_REQUEST,
      errors: error.issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message
      }))
    });
  } else if (error instanceof ResponseError) {
    res.status(error.status).json({
      success: false,
      status_code: error.status,
      errors: error.message
    });
  } else {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      status_code: StatusCodes.INTERNAL_SERVER_ERROR,
      errors: error.message
    });
  }
};
