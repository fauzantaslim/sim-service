import { Session } from '../models/session.model';

/**
 * Request untuk membuat session baru.
 */
export type CreateSessionRequest = Omit<
  Session,
  'session_id' | 'created_at' | 'updated_at'
>;

/**
 * Request untuk memperbarui session.
 */
export type UpdateSessionRequest = Partial<
  Omit<Session, 'session_id' | 'user_id' | 'created_at'>
>;

/**
 * Request untuk menghapus session berdasarkan ID.
 */
export type DeleteSessionRequest = {
  session_id: number;
};

/**
 * Request untuk menghapus semua session user.
 */
export type DeleteUserSessionsRequest = {
  user_id: string;
};

/**
 * Request untuk mencari session berdasarkan refresh token.
 */
export type FindSessionByTokenRequest = {
  refresh_token: string;
};

/**
 * Struktur response umum untuk data session.
 */
export type SessionResponse = Omit<Session, 'refresh_token'>;

/**
 * Mengubah instance model Session menjadi objek response yang konsisten.
 *
 * @param {Session} session - Objek Session dari database.
 * @returns {SessionResponse} - Representasi session yang siap dikirim sebagai response.
 */
export function toSessionResponse(session: Session): SessionResponse {
  return {
    session_id: session.session_id,
    expires_at: session.expires_at,
    user_agent: session.user_agent,
    ip_address: session.ip_address,
    user_id: session.user_id,
    created_at: session.created_at,
    updated_at: session.updated_at,
    revoked_at: session.revoked_at
  };
}
