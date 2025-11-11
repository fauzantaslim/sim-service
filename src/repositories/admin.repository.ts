import { Admin } from '../models/admin';
import { PaginationParams, PaginationResponse } from '../types/pagination.type';
import { AdminResponse, toAdminResponse } from '../types/admin.type';
import db from '../configs/database';
import { nanoid } from 'nanoid';
import { hashing } from '../utils/hashing';

/**
 * Repository untuk operasi database terkait Admin.
 */
export class AdminRepository {
  private tableName = 'admin';

  /**
   * Helper method untuk mengatur sorting yang aman
   */
  private applySorting(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: any,
    sort_by: string,
    sort_order: 'asc' | 'desc'
  ) {
    const allowedSortFields = new Set([
      'email',
      'full_name',
      'created_at',
      'updated_at'
    ]);

    if (allowedSortFields.has(sort_by)) {
      return query.orderBy(`${this.tableName}.${sort_by}`, sort_order);
    } else {
      // Default sorting jika field tidak valid
      return query.orderBy(`${this.tableName}.created_at`, 'desc');
    }
  }

  /**
   * Membuat Admin baru di database.
   */
  async create(
    adminData: Omit<Admin, 'admin_id' | 'created_at' | 'updated_at'>
  ): Promise<AdminResponse> {
    // Generate admin_id menggunakan nanoid
    const adminId = nanoid();

    // Hash password sebelum disimpan
    const hashedPassword = await hashing(adminData.password);

    await db(this.tableName).insert({
      admin_id: adminId,
      email: adminData.email,
      full_name: adminData.full_name,
      password: hashedPassword,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    // Ambil Admin yang baru dibuat
    const admin = await db(this.tableName).where('admin_id', adminId).first();

    if (!admin) {
      throw new Error('Gagal membuat Admin');
    }

    return toAdminResponse(admin);
  }

  /**
   * Mengambil semua Admin dengan pagination dan search.
   */
  async findAll(
    params: PaginationParams
  ): Promise<PaginationResponse<AdminResponse>> {
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

    // Sorting dengan validasi field
    query = this.applySorting(query, sort_by, sort_order);

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
      data: data.map(toAdminResponse),
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
   * Mengambil Admin berdasarkan ID.
   */
  async findById(adminId: string): Promise<AdminResponse | null> {
    const admin = await db(this.tableName).where('admin_id', adminId).first();

    return admin ? toAdminResponse(admin) : null;
  }

  /**
   * Mengambil Admin berdasarkan email (untuk autentikasi).
   */
  async findByEmail(email: string): Promise<Admin | null> {
    const admin = await db(this.tableName).where('email', email).first();

    return admin || null;
  }

  /**
   * Memperbarui data Admin.
   */
  async update(
    adminId: string,
    adminData: Partial<Omit<Admin, 'admin_id' | 'created_at'>>
  ): Promise<AdminResponse | null> {
    const updateData: Partial<Admin> = {
      ...adminData,
      updated_at: db.fn.now() as unknown as Date
    };

    // Hash password jika diupdate
    if (adminData.password) {
      updateData.password = await hashing(adminData.password);
    }

    const updatedRows = await db(this.tableName)
      .where('admin_id', adminId)
      .update(updateData);

    if (updatedRows === 0) {
      return null;
    }

    // Ambil Admin yang sudah diupdate
    const admin = await db(this.tableName).where('admin_id', adminId).first();

    return admin ? toAdminResponse(admin) : null;
  }

  /**
   * Menghapus Admin berdasarkan ID.
   */
  async delete(adminId: string): Promise<boolean> {
    const deletedRows = await db(this.tableName)
      .where('admin_id', adminId)
      .del();

    return deletedRows > 0;
  }

  /**
   * Mengecek apakah email Admin sudah digunakan.
   */
  async isEmailExists(
    email: string,
    excludeAdminId?: string
  ): Promise<boolean> {
    let query = db(this.tableName).where('email', email);

    if (excludeAdminId) {
      query = query.whereNot('admin_id', excludeAdminId);
    }

    const admin = await query.first();
    return !!admin;
  }
}
