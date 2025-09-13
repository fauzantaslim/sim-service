import { Request } from 'express';

/**
 * Payload user yang digunakan untuk autentikasi dan otorisasi.
 */
export type UserPayload = {
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
};

export interface UserRequest extends Request {
  user?: UserPayload;
}
