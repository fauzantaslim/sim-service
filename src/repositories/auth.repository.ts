import { User } from '../models/user.model';
import db from '../configs/database';

/**
 * Repository untuk operasi database terkait autentikasi.
 */
export class AuthRepository {
  private tableName = 'users';

  /**
   * Mengambil user berdasarkan email untuk login.
   */
  async findByEmail(email: string): Promise<User | null> {
    return await db(this.tableName).where('email', email).first();
  }

  /**
   * Mengambil user berdasarkan ID untuk validasi token.
   */
  async findById(userId: string): Promise<User | null> {
    return await db(this.tableName).where('user_id', userId).first();
  }

  /**
   * Memperbarui last_login timestamp user.
   */
  async updateLastLogin(userId: string): Promise<void> {
    await db(this.tableName).where('user_id', userId).update({
      updated_at: db.fn.now()
    });
  }
}
