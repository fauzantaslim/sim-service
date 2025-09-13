import { Session } from '../models/session.model';
import { SessionResponse, toSessionResponse } from '../types/session.type';
import { compareHashedData } from '../utils/hashing';
import db from '../configs/database';

/**
 * Repository untuk operasi database terkait session.
 */
export class SessionRepository {
  private tableName = 'sessions';

  /**
   * Membuat session baru di database.
   */
  async create(
    sessionData: Omit<Session, 'session_id' | 'created_at' | 'updated_at'>
  ): Promise<SessionResponse> {
    const [session] = await db(this.tableName)
      .insert({
        ...sessionData,
        created_at: db.fn.now(),
        updated_at: db.fn.now()
      })
      .returning('*');

    return toSessionResponse(session);
  }

  /**
   * Mengambil session berdasarkan ID.
   */
  async findById(sessionId: number): Promise<SessionResponse | null> {
    const session = await db(this.tableName)
      .where('session_id', sessionId)
      .first();

    return session ? toSessionResponse(session) : null;
  }

  /**
   * Mengambil session berdasarkan refresh token (untuk token yang tidak di-hash).
   */
  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    return await db(this.tableName)
      .where('refresh_token', refreshToken)
      .whereNull('revoked_at')
      .first();
  }

  /**
   * Mencari session berdasarkan refresh token yang di-hash.
   * Menggunakan compareHashedData untuk membandingkan token.
   */
  async findByHashedRefreshToken(
    refreshToken: string
  ): Promise<Session | null> {
    const sessions = await db(this.tableName)
      .whereNull('revoked_at')
      .where('expires_at', '>', db.fn.now())
      .select('*');

    for (const session of sessions) {
      const isMatch = await compareHashedData(
        refreshToken,
        session.refresh_token
      );
      if (isMatch) {
        return session;
      }
    }

    return null;
  }

  /**
   * Mengambil semua session user yang aktif.
   */
  async findByUserId(userId: string): Promise<SessionResponse[]> {
    const sessions = await db(this.tableName)
      .where('user_id', userId)
      .whereNull('revoked_at')
      .orderBy('created_at', 'desc');

    return sessions.map(toSessionResponse);
  }

  /**
   * Memperbarui data session.
   */
  async update(
    sessionId: number,
    sessionData: Partial<Omit<Session, 'session_id' | 'user_id' | 'created_at'>>
  ): Promise<SessionResponse | null> {
    const updatedRows = await db(this.tableName)
      .where('session_id', sessionId)
      .update({
        ...sessionData,
        updated_at: db.fn.now()
      });

    if (updatedRows === 0) {
      return null;
    }

    // Ambil session yang sudah diupdate
    const session = await db(this.tableName)
      .where('session_id', sessionId)
      .first();

    return session ? toSessionResponse(session) : null;
  }

  /**
   * Menghapus session berdasarkan ID.
   */
  async delete(sessionId: number): Promise<boolean> {
    const deletedRows = await db(this.tableName)
      .where('session_id', sessionId)
      .del();

    return deletedRows > 0;
  }

  /**
   * Menghapus semua session user.
   */
  async deleteByUserId(userId: string): Promise<number> {
    const deletedRows = await db(this.tableName).where('user_id', userId).del();

    return deletedRows;
  }

  /**
   * Revoke session (soft delete).
   */
  async revoke(sessionId: number): Promise<boolean> {
    const updatedRows = await db(this.tableName)
      .where('session_id', sessionId)
      .update({
        revoked_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    return updatedRows > 0;
  }

  /**
   * Revoke semua session user.
   */
  async revokeByUserId(userId: string): Promise<number> {
    const updatedRows = await db(this.tableName)
      .where('user_id', userId)
      .whereNull('revoked_at')
      .update({
        revoked_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    return updatedRows;
  }

  /**
   * Membersihkan session yang sudah expired.
   */
  async cleanExpiredSessions(): Promise<number> {
    const deletedRows = await db(this.tableName)
      .where('expires_at', '<', db.fn.now())
      .del();

    return deletedRows;
  }

  /**
   * Mengecek apakah refresh token masih valid (untuk token yang tidak di-hash).
   */
  async isTokenValid(refreshToken: string): Promise<boolean> {
    const session = await db(this.tableName)
      .where('refresh_token', refreshToken)
      .whereNull('revoked_at')
      .where('expires_at', '>', db.fn.now())
      .first();

    return !!session;
  }

  /**
   * Mengecek apakah refresh token yang di-hash masih valid.
   */
  async isHashedTokenValid(refreshToken: string): Promise<boolean> {
    const session = await this.findByHashedRefreshToken(refreshToken);
    return !!session;
  }
}
