import { User } from '../models/user.model';
import { PaginationParams, PaginationResponse } from '../types/pagination.type';
import { UserResponse, toUserResponse } from '../types/user.type';
import db from '../configs/database';
import { nanoid } from 'nanoid';

/**
 * Repository untuk operasi database terkait user.
 */
export class UserRepository {
  private tableName = 'users';

  /**
   * Membuat user baru di database.
   */
  async create(userData: Omit<User, 'user_id'>): Promise<UserResponse> {
    // Generate user_id menggunakan nanoid
    const userId = nanoid();

    await db(this.tableName).insert({
      ...userData,
      user_id: userId
    });

    // Ambil user yang baru dibuat
    const user = await db(this.tableName).where('user_id', userId).first();

    if (!user) {
      throw new Error('Gagal membuat user');
    }

    return toUserResponse(user);
  }

  /**
   * Mengambil semua user dengan pagination dan search.
   */
  async findAll(
    params: PaginationParams
  ): Promise<PaginationResponse<UserResponse>> {
    const {
      page,
      limit,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = params;
    const offset = (page - 1) * limit;

    // Query builder untuk data
    let query = db(this.tableName).select('*');

    // Filter search jika ada
    if (search) {
      query = query.where(function () {
        this.where('email', 'like', `%${search}%`).orWhere(
          'full_name',
          'like',
          `%${search}%`
        );
      });
    }

    // Sorting
    query = query.orderBy(sort_by, sort_order);

    // Pagination
    const data = await query.limit(limit).offset(offset);

    // Query untuk total count
    let countQuery = db(this.tableName);
    if (search) {
      countQuery = countQuery.where(function () {
        this.where('email', 'like', `%${search}%`).orWhere(
          'full_name',
          'like',
          `%${search}%`
        );
      });
    }

    const [{ count }] = await countQuery.count('* as count');
    const totalItems = parseInt(count as string);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: data.map(toUserResponse),
      pagination: {
        total_items: totalItems,
        total_pages: totalPages,
        current_page: page,
        limit,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };
  }

  /**
   * Mengambil user berdasarkan ID.
   */
  async findById(userId: string): Promise<UserResponse | null> {
    const user = await db(this.tableName).where('user_id', userId).first();

    return user ? toUserResponse(user) : null;
  }

  /**
   * Mengambil user berdasarkan email.
   */
  async findByEmail(email: string): Promise<User | null> {
    return await db(this.tableName).where('email', email).first();
  }

  /**
   * Memperbarui data user.
   */
  async update(
    userId: string,
    userData: Partial<Omit<User, 'user_id'>>
  ): Promise<UserResponse | null> {
    const updatedRows = await db(this.tableName)
      .where('user_id', userId)
      .update({
        ...userData,
        updated_at: db.fn.now()
      });

    if (updatedRows === 0) {
      return null;
    }

    // Ambil user yang sudah diupdate
    const user = await db(this.tableName).where('user_id', userId).first();

    return user ? toUserResponse(user) : null;
  }

  /**
   * Menghapus user berdasarkan ID.
   */
  async delete(userId: string): Promise<boolean> {
    const deletedRows = await db(this.tableName).where('user_id', userId).del();

    return deletedRows > 0;
  }

  /**
   * Mengecek apakah email sudah digunakan.
   */
  async isEmailExists(email: string, excludeUserId?: string): Promise<boolean> {
    let query = db(this.tableName).where('email', email);

    if (excludeUserId) {
      query = query.whereNot('user_id', excludeUserId);
    }

    const user = await query.first();
    return !!user;
  }
}
