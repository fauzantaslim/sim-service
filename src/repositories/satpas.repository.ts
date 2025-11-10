import { Satpas } from '../models/satpas.model';
import { PaginationParams, PaginationResponse } from '../types/pagination.type';
import { SatpasResponse, toSatpasResponse } from '../types/satpas.type';
import db from '../configs/database';
import { nanoid } from 'nanoid';

/**
 * Repository untuk operasi database terkait Satpas.
 */
export class SatpasRepository {
  private tableName = 'satpas';

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
      'name',
      'latitude',
      'longitude',
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
   * Membuat Satpas baru di database.
   */
  async create(
    satpasData: Omit<Satpas, 'satpas_id' | 'created_at' | 'updated_at'>
  ): Promise<SatpasResponse> {
    // Generate satpas_id menggunakan nanoid
    const satpasId = nanoid();

    await db(this.tableName).insert({
      ...satpasData,
      satpas_id: satpasId,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    // Ambil Satpas yang baru dibuat
    const satpas = await db(this.tableName)
      .where('satpas_id', satpasId)
      .first();

    if (!satpas) {
      throw new Error('Gagal membuat Satpas');
    }

    return toSatpasResponse(satpas);
  }

  /**
   * Mengambil semua Satpas dengan pagination dan search.
   */
  async findAll(
    params: PaginationParams
  ): Promise<PaginationResponse<SatpasResponse>> {
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
        this.where('name', 'like', `%${search}%`);
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
        this.where('name', 'like', `%${search}%`);
      });
    }

    const [{ count }] = await countQuery.count('* as count');
    const totalItems = parseInt(count as string);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: data.map(toSatpasResponse),
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
   * Mengambil Satpas berdasarkan ID.
   */
  async findById(satpasId: string): Promise<SatpasResponse | null> {
    const satpas = await db(this.tableName)
      .where('satpas_id', satpasId)
      .first();

    return satpas ? toSatpasResponse(satpas) : null;
  }

  /**
   * Memperbarui data Satpas.
   */
  async update(
    satpasId: string,
    satpasData: Partial<Omit<Satpas, 'satpas_id' | 'created_at'>>
  ): Promise<SatpasResponse | null> {
    const updatedRows = await db(this.tableName)
      .where('satpas_id', satpasId)
      .update({
        ...satpasData,
        updated_at: db.fn.now()
      });

    if (updatedRows === 0) {
      return null;
    }

    // Ambil Satpas yang sudah diupdate
    const satpas = await db(this.tableName)
      .where('satpas_id', satpasId)
      .first();

    return satpas ? toSatpasResponse(satpas) : null;
  }

  /**
   * Menghapus Satpas berdasarkan ID.
   */
  async delete(satpasId: string): Promise<boolean> {
    const deletedRows = await db(this.tableName)
      .where('satpas_id', satpasId)
      .del();

    return deletedRows > 0;
  }

  /**
   * Mengecek apakah nama Satpas sudah digunakan.
   */
  async isNameExists(name: string, excludeSatpasId?: string): Promise<boolean> {
    let query = db(this.tableName).where('name', name);

    if (excludeSatpasId) {
      query = query.whereNot('satpas_id', excludeSatpasId);
    }

    const satpas = await query.first();
    return !!satpas;
  }
}
