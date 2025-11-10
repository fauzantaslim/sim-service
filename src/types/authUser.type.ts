import { User } from '../models/user.model';

/**
 * Request body untuk memulai proses registrasi (mengirim OTP).
 */
export type UserRegisterRequest = {
  phone_number: string;
};

/**
 * Request body untuk verifikasi OTP.
 */
export type UserVerifyOTPRequest = {
  phone_number: string;
  otp: string;
};

/**
 * Request body untuk set PIN setelah verifikasi OTP.
 */
export type UserSetPinRequest = {
  user_id: string;
  pin: string;
};

/**
 * Request body untuk login user.
 */
export type UserLoginRequest = {
  phone_number: string;
  pin: string;
};

/**
 * Request untuk logout user.
 */
export type UserLogoutRequest = Record<string, never>;

/**
 * Request body untuk refresh token user.
 */
export type UserRefreshTokenRequest = {
  refresh_token: string;
};

/**
 * Struktur response umum untuk data user (tanpa pin).
 */
export type UserResponse = Omit<User, 'pin'>;

/**
 * Response untuk login user yang berhasil.
 */
export type UserLoginResponse = {
  tokens: {
    access_token: string;
    refresh_token: string;
    csrf_token: string;
  };
  user: UserResponse;
};

/**
 * Response untuk refresh token user yang berhasil.
 */
export type UserRefreshTokenResponse = {
  tokens: {
    access_token: string;
    csrf_token: string;
  };
  user: UserResponse;
};

/**
 * Response untuk logout user yang berhasil.
 */
export type UserLogoutResponse = {
  message: string;
};

/**
 * Mengubah instance model User menjadi objek response yang konsisten.
 *
 * @param {User} user - Objek User dari database.
 * @returns {UserResponse} - Representasi user yang siap dikirim sebagai response.
 */
export function toUserResponse(user: User): UserResponse {
  return {
    user_id: user.user_id,
    nik: user.nik,
    email: user.email,
    full_name: user.full_name,
    phone_number: user.phone_number,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}
