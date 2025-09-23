import { User } from '../models/user.model';

/**
 * Request untuk operasi yang memerlukan user_id.
 */
export type UserIdRequest = {
  user_id: string;
};

/**
 * Request body untuk membuat user baru (tanpa user_id karena auto-generated).
 */
export type CreateUserRequest = Omit<User, 'user_id'>;

/**
 * Request body untuk memperbarui data user yang sudah ada.
 */
export type UpdateUserRequest = UserIdRequest & Partial<Omit<User, 'user_id'>>;

/**
 * Request untuk mengambil detail user berdasarkan ID.
 */
export type GetUserRequest = UserIdRequest;

/**
 * Request untuk menghapus user.
 */
export type DeleteUserRequest = UserIdRequest;

/**
 * Struktur response umum untuk data user (tanpa password).
 */
export type UserResponse = Omit<User, 'password'>;

/**
 * Request body untuk login user.
 */
export type LoginRequest = {
  email: string;
  password: string;
};

/**
 * Request untuk logout user.
 */
export type LogoutRequest = Record<string, never>;

/**
 * Response untuk login yang berhasil.
 */
export type LoginResponse = {
  tokens: {
    access_token: string;
    refresh_token: string;
    csrf_token: string;
  };
  user: UserResponse;
};

/**
 * Response untuk refresh token yang berhasil.
 */
export type RefreshTokenResponse = {
  tokens: {
    access_token: string;
  };
  user: UserResponse;
};

/**
 * Response untuk logout yang berhasil.
 */
export type LogoutResponse = {
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
    email: user.email,
    full_name: user.full_name,
    is_active: Boolean(user.is_active)
  };
}
