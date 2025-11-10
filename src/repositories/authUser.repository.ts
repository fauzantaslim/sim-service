import { User } from '../models/user.model';
import { nanoid } from 'nanoid';
import db from '../configs/database';

/**
 * Repository untuk operasi database terkait autentikasi pengguna.
 */
export class AuthUserRepository {
  /**
   * Membuat user baru.
   */
  async createUser(phoneNumber: string): Promise<User> {
    const newUser: User = {
      user_id: nanoid(),
      phone_number: phoneNumber,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db(this.tableName).insert(newUser);
    return newUser;
  }

  private tableName = 'users';

  /**
   * Mengambil user berdasarkan nomor telepon.
   */
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return await db(this.tableName).where('phone_number', phoneNumber).first();
  }

  /**
   * Mengambil user berdasarkan ID untuk validasi token.
   */
  async findById(userId: string): Promise<User | null> {
    return await db(this.tableName).where('user_id', userId).first();
  }

  /**
   * Memperbarui timestamp updated_at user.
   */
  async updateUserTimestamp(userId: string): Promise<void> {
    await db(this.tableName).where('user_id', userId).update({
      updated_at: db.fn.now()
    });
  }

  /**
   * Memperbarui data user.
   */
  async updateUser(
    userId: string,
    userData: Partial<Omit<User, 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    await db(this.tableName)
      .where('user_id', userId)
      .update({
        ...userData,
        updated_at: db.fn.now()
      });
  }
}
