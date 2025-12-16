import { nanoid } from 'nanoid';
import db from '../configs/database';
import {
  PendaftaranSIM,
  StatusPendaftaran
} from '../models/pendaftaranSIM.model';
import {
  PendaftaranSIMPaginationParams,
  PaginationResponse
} from '../types/pagination.type';
import {
  PendaftaranSIMResponse,
  toPendaftaranSIMResponse
} from '../types/pendaftaranSIM.type';
import logger from '../utils/logger';

/**
 * Repository untuk operasi database terkait Pendaftaran SIM.
 */
export class PendaftaranSIMRepository {
  private tableName = 'pendaftaran_sim';

  /**
   * Generate kode pendaftaran unik
   */
  private generateKodePendaftaran(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = nanoid(6).toUpperCase();
    return `REG-${timestamp}-${random}`;
  }

  /**
   * Membuat pendaftaran SIM baru.
   */
  async create(
    pendaftaranData: Omit<
      PendaftaranSIM,
      | 'pendaftaran_id'
      | 'kode_pendaftaran'
      | 'status'
      | 'created_at'
      | 'updated_at'
    >
  ): Promise<PendaftaranSIMResponse> {
    const pendaftaran_id = nanoid();
    const kode_pendaftaran = this.generateKodePendaftaran();

    const newPendaftaran = {
      pendaftaran_id,
      kode_pendaftaran,
      ...pendaftaranData,
      status: 'diajukan' as StatusPendaftaran,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db(this.tableName).insert(newPendaftaran);

    logger.info({
      pendaftaran_id,
      kode_pendaftaran,
      message: 'Pendaftaran SIM created in database'
    });

    return toPendaftaranSIMResponse(newPendaftaran);
  }

  /**
   * Mengambil semua pendaftaran dengan pagination (Admin only).
   */
  async findAll(
    params: PendaftaranSIMPaginationParams
  ): Promise<PaginationResponse<PendaftaranSIMResponse>> {
    const {
      page,
      limit,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
      status_pendaftaran
    } = params;
    const offset = (page - 1) * limit;

    let query = db(this.tableName).select('*');

    // Filter by status if provided
    if (status_pendaftaran) {
      query = query.where('status', status_pendaftaran);
    }

    // Search by kode_pendaftaran or status
    if (search) {
      query = query.where((builder) => {
        builder
          .where('kode_pendaftaran', 'like', `%${search}%`)
          .orWhere('status', 'like', `%${search}%`);
      });
    }

    // Sorting
    const allowedSortFields = [
      'kode_pendaftaran',
      'tanggal_ujian',
      'status',
      'created_at',
      'updated_at'
    ];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    query = query.orderBy(sortField, sort_order);

    // Get paginated data
    const pendaftaranList: PendaftaranSIM[] = await query
      .limit(limit)
      .offset(offset);

    // Get total count
    let countQuery = db(this.tableName);

    // Apply same filters for count query
    if (status_pendaftaran) {
      countQuery = countQuery.where('status', status_pendaftaran);
    }

    if (search) {
      countQuery = countQuery.where(function () {
        this.where('kode_pendaftaran', 'like', `%${search}%`).orWhere(
          'status',
          'like',
          `%${search}%`
        );
      });
    }

    const [{ count }] = await countQuery.count('* as count');
    const totalItems = parseInt(count as string);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: pendaftaranList.map(toPendaftaranSIMResponse),
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
   * Mengambil pendaftaran berdasarkan user_id dengan pagination.
   */
  async findByUserId(
    user_id: string,
    params: PendaftaranSIMPaginationParams
  ): Promise<PaginationResponse<PendaftaranSIMResponse>> {
    const {
      page,
      limit,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
      status_pendaftaran
    } = params;
    const offset = (page - 1) * limit;

    let query = db(this.tableName).select('*').where('user_id', user_id);

    // Filter by status if provided
    if (status_pendaftaran) {
      query = query.where('status', status_pendaftaran);
    }

    // Search by kode_pendaftaran or status
    if (search) {
      query = query.where((builder) => {
        builder
          .where('kode_pendaftaran', 'like', `%${search}%`)
          .orWhere('status', 'like', `%${search}%`);
      });
    }

    // Sorting
    const allowedSortFields = [
      'kode_pendaftaran',
      'tanggal_ujian',
      'status',
      'created_at',
      'updated_at'
    ];
    const sortField = allowedSortFields.includes(sort_by)
      ? sort_by
      : 'created_at';
    query = query.orderBy(sortField, sort_order);

    // Get paginated data
    const pendaftaranList: PendaftaranSIM[] = await query
      .limit(limit)
      .offset(offset);

    // Get total count
    let countQuery = db(this.tableName).where('user_id', user_id);

    // Apply same filters for count query
    if (status_pendaftaran) {
      countQuery = countQuery.where('status', status_pendaftaran);
    }

    if (search) {
      countQuery = countQuery.where(function () {
        this.where('kode_pendaftaran', 'like', `%${search}%`).orWhere(
          'status',
          'like',
          `%${search}%`
        );
      });
    }

    const [{ count }] = await countQuery.count('* as count');
    const totalItems = parseInt(count as string);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: pendaftaranList.map(toPendaftaranSIMResponse),
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
   * Mengambil pendaftaran berdasarkan ID.
   */
  async findById(
    pendaftaran_id: string
  ): Promise<PendaftaranSIMResponse | null> {
    const pendaftaran: PendaftaranSIM | undefined = await db(this.tableName)
      .where({ pendaftaran_id })
      .first();

    if (!pendaftaran) {
      return null;
    }

    return toPendaftaranSIMResponse(pendaftaran);
  }

  /**
   * Update status pendaftaran (Admin only).
   */
  async updateStatus(
    pendaftaran_id: string,
    status: StatusPendaftaran
  ): Promise<PendaftaranSIMResponse | null> {
    const updated = await db(this.tableName).where({ pendaftaran_id }).update({
      status,
      updated_at: new Date()
    });

    if (updated === 0) {
      return null;
    }

    logger.info({
      pendaftaran_id,
      status,
      message: 'Pendaftaran SIM status updated in database'
    });

    return this.findById(pendaftaran_id);
  }

  /**
   * Menghapus pendaftaran berdasarkan ID.
   */
  async delete(pendaftaran_id: string): Promise<boolean> {
    const deleted = await db(this.tableName).where({ pendaftaran_id }).del();

    if (deleted > 0) {
      logger.info({
        pendaftaran_id,
        message: 'Pendaftaran SIM deleted from database'
      });
      return true;
    }

    return false;
  }

  /**
   * Cek apakah user sudah memiliki pendaftaran aktif untuk jenis SIM tertentu.
   */
  async hasActivePendaftaran(
    user_id: string,
    jenis_sim: string
  ): Promise<boolean> {
    const activeStatuses = [
      'diajukan',
      'diperiksa',
      'disetujui',
      'proses_ujian'
    ];

    const count = await db(this.tableName)
      .where({ user_id, jenis_sim })
      .whereIn('status', activeStatuses)
      .count('* as total')
      .first();

    return Number(count?.total) > 0;
  }
}
