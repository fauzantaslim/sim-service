import { Admin } from '../models/admin';
import db from '../configs/database';

/**
 * Repository untuk operasi database terkait autentikasi admin.
 */
export class AuthAdminRepository {
  private tableName = 'admin';

  /**
   * Mengambil admin berdasarkan email untuk login.
   */
  async findByEmail(email: string): Promise<Admin | null> {
    return await db(this.tableName).where('email', email).first();
  }

  /**
   * Mengambil admin berdasarkan ID untuk validasi token.
   */
  async findById(adminId: string): Promise<Admin | null> {
    return await db(this.tableName).where('admin_id', adminId).first();
  }

  /**
   * Memperbarui updated_at (sebagai last login marker).
   */
  async updateLastLogin(adminId: string): Promise<void> {
    await db(this.tableName).where('admin_id', adminId).update({
      updated_at: db.fn.now()
    });
  }
}
