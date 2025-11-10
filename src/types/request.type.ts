import { Request } from 'express';

/**
 * Peran yang mungkin ada dalam sistem.
 */
export type Role = 'user' | 'admin';

/**
 * Payload dasar yang ada di setiap token.
 */
interface BasePayload {
  role: Role;
  iat: number;
  exp: number;
}

/**
 * Payload untuk user biasa.
 */
export interface UserPayload extends BasePayload {
  role: 'user';
  user_id: string;
  phone_number: string;
  full_name?: string; // Optional karena user baru belum tentu punya full_name
}

/**
 * Payload untuk admin.
 */
export interface AdminPayload extends BasePayload {
  role: 'admin';
  admin_id: string;
  email: string;
  full_name: string;
}

/**
 * Tipe gabungan untuk semua jenis payload otentikasi.
 */
export type AuthPayload = UserPayload | AdminPayload;

/**
 * Interface request yang sudah ditambahi data otentikasi.
 */
export interface AuthRequest extends Request {
  auth?: AuthPayload;
}
