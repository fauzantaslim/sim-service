import { KTP } from '../models/ktp.model';
import {
  KTPPaginationParams,
  PaginationResponse
} from '../types/pagination.type';
import { KTPResponse, toKTPResponse } from '../types/ktp.type';
import db from '../configs/database';
import { nanoid } from 'nanoid';

/**
 * Repository untuk operasi database terkait KTP.
 */
export class KTPRepository {
  private tableName = 'ktp';

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
      'nik',
      'tempat_lahir',
      'tanggal_lahir',
      'jenis_kelamin',
      'agama',
      'status_perkawinan',
      'gol_darah',
      'pekerjaan',
      'created_at',
      'updated_at'
    ]);

    if (sort_by === 'creator_name') {
      return query.orderBy('users.full_name', sort_order);
    } else if (allowedSortFields.has(sort_by)) {
      return query.orderBy(`ktp.${sort_by}`, sort_order);
    } else {
      // Default sorting jika field tidak valid
      return query.orderBy('ktp.created_at', 'desc');
    }
  }

  /**
   * Membuat KTP baru di database.
   */
  async create(
    ktpData: Omit<KTP, 'ktp_id' | 'created_at' | 'updated_at'>
  ): Promise<KTPResponse> {
    // Generate ktp_id menggunakan nanoid
    const ktpId = nanoid();

    await db(this.tableName).insert({
      ...ktpData,
      ktp_id: ktpId,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    // Ambil KTP yang baru dibuat dengan creator_name
    const ktp = await db(this.tableName)
      .leftJoin('users', 'ktp.created_by', 'users.user_id')
      .select('ktp.*', 'users.full_name as creator_name')
      .where('ktp.ktp_id', ktpId)
      .first();

    if (!ktp) {
      throw new Error('Gagal membuat KTP');
    }

    return toKTPResponse(ktp);
  }

  /**
   * Mengambil semua KTP dengan pagination, search, dan filter enum.
   */
  async findAll(
    params: KTPPaginationParams
  ): Promise<PaginationResponse<KTPResponse>> {
    const {
      page,
      limit,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
      jenis_kelamin,
      agama,
      status_perkawinan,
      gol_darah
    } = params;
    const offset = (page - 1) * limit;

    // Query builder untuk data dengan JOIN ke users untuk creator_name
    let query = db(this.tableName)
      .leftJoin('users', 'ktp.created_by', 'users.user_id')
      .select('ktp.*', 'users.full_name as creator_name');

    // Filter search jika ada
    if (search) {
      query = query.where(function () {
        this.where('ktp.nik', 'ilike', `%${search}%`)
          .orWhere('ktp.alamat', 'ilike', `%${search}%`)
          .orWhere('ktp.tempat_lahir', 'ilike', `%${search}%`)
          .orWhere('ktp.pekerjaan', 'ilike', `%${search}%`)
          .orWhere('ktp.kewarganegaraan', 'ilike', `%${search}%`)
          .orWhere('users.full_name', 'ilike', `%${search}%`);
      });
    }

    // Filter enum jika ada
    if (jenis_kelamin) {
      query = query.where('ktp.jenis_kelamin', jenis_kelamin);
    }
    if (agama) {
      query = query.where('ktp.agama', agama);
    }
    if (status_perkawinan) {
      query = query.where('ktp.status_perkawinan', status_perkawinan);
    }
    if (gol_darah) {
      query = query.where('ktp.gol_darah', gol_darah);
    }

    // Sorting dengan validasi field
    query = this.applySorting(query, sort_by, sort_order);

    // Pagination
    const data = await query.limit(limit).offset(offset);

    // Query untuk total count
    let countQuery = db(this.tableName).leftJoin(
      'users',
      'ktp.created_by',
      'users.user_id'
    );
    if (search) {
      countQuery = countQuery.where(function () {
        this.where('ktp.nik', 'ilike', `%${search}%`)
          .orWhere('ktp.alamat', 'ilike', `%${search}%`)
          .orWhere('ktp.tempat_lahir', 'ilike', `%${search}%`)
          .orWhere('ktp.pekerjaan', 'ilike', `%${search}%`)
          .orWhere('ktp.kewarganegaraan', 'ilike', `%${search}%`)
          .orWhere('users.full_name', 'ilike', `%${search}%`);
      });
    }

    // Filter enum untuk count query
    if (jenis_kelamin) {
      countQuery = countQuery.where('ktp.jenis_kelamin', jenis_kelamin);
    }
    if (agama) {
      countQuery = countQuery.where('ktp.agama', agama);
    }
    if (status_perkawinan) {
      countQuery = countQuery.where('ktp.status_perkawinan', status_perkawinan);
    }
    if (gol_darah) {
      countQuery = countQuery.where('ktp.gol_darah', gol_darah);
    }

    const [{ count }] = await countQuery.count('* as count');
    const totalItems = parseInt(count as string);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: data.map(toKTPResponse),
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
   * Mengambil KTP berdasarkan ID.
   */
  async findById(ktpId: string): Promise<KTPResponse | null> {
    const ktp = await db(this.tableName)
      .leftJoin('users', 'ktp.created_by', 'users.user_id')
      .select('ktp.*', 'users.full_name as creator_name')
      .where('ktp.ktp_id', ktpId)
      .first();

    return ktp ? toKTPResponse(ktp) : null;
  }

  /**
   * Memperbarui data KTP.
   */
  async update(
    ktpId: string,
    ktpData: Partial<Omit<KTP, 'ktp_id' | 'created_by' | 'created_at'>>
  ): Promise<KTPResponse | null> {
    const updatedRows = await db(this.tableName)
      .where('ktp_id', ktpId)
      .update({
        ...ktpData,
        updated_at: db.fn.now()
      });

    if (updatedRows === 0) {
      return null;
    }

    // Ambil KTP yang sudah diupdate dengan creator_name
    const ktp = await db(this.tableName)
      .leftJoin('users', 'ktp.created_by', 'users.user_id')
      .select('ktp.*', 'users.full_name as creator_name')
      .where('ktp.ktp_id', ktpId)
      .first();

    return ktp ? toKTPResponse(ktp) : null;
  }

  /**
   * Menghapus KTP berdasarkan ID.
   */
  async delete(ktpId: string): Promise<boolean> {
    const deletedRows = await db(this.tableName).where('ktp_id', ktpId).del();

    return deletedRows > 0;
  }

  /**
   * Mengecek apakah NIK sudah digunakan.
   */
  async isNIKExists(nik: string, excludeKtpId?: string): Promise<boolean> {
    let query = db(this.tableName).where('nik', nik);

    if (excludeKtpId) {
      query = query.whereNot('ktp_id', excludeKtpId);
    }

    const ktp = await query.first();
    return !!ktp;
  }
}
