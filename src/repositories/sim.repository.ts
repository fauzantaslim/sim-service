import { SIM } from '../models/sim.model';
import { PaginationParams, PaginationResponse } from '../types/pagination.type';
import { SIMResponse, toSIMResponse } from '../types/sim.type';
import db from '../configs/database';
import { nanoid } from 'nanoid';
import logger from '../utils/logger';

/**
 * Repository untuk operasi database terkait SIM.
 */
export class SIMRepository {
  private tableName = 'sim';

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
      'nomor_sim',
      'tanggal_terbit',
      'tanggal_expired',
      'created_at',
      'updated_at'
    ]);

    if (sort_by === 'creator_name') {
      return query.orderBy('admin.full_name', sort_order);
    } else if (allowedSortFields.has(sort_by)) {
      return query.orderBy(`sim.${sort_by}`, sort_order);
    } else {
      // Default sorting jika field tidak valid
      return query.orderBy('sim.created_at', 'desc');
    }
  }

  /**
   * Generate nomor SIM unik dengan format 16 digit
   * Format: YYYYMMDD + 8 digit random
   */
  private async generateNomorSIM(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');

    const prefix = `${year}${month}${day}`;

    // Generate 8 digit random number
    let nomorSim: string;
    let exists = true;

    while (exists) {
      const randomPart = Math.floor(
        10000000 + Math.random() * 90000000
      ).toString();
      nomorSim = `${prefix}${randomPart}`;

      // Check if exists
      exists = await this.isNomorSimExists(nomorSim);
    }

    return nomorSim!;
  }

  /**
   * Membuat SIM baru di database.
   */
  async create(
    simData: Omit<SIM, 'sim_id' | 'nomor_sim' | 'created_at' | 'updated_at'>
  ): Promise<SIMResponse> {
    const simId = nanoid();
    const nomorSim = await this.generateNomorSIM();

    logger.info({
      sim_id: simId,
      nomor_sim: nomorSim,
      pendaftaran_id: simData.pendaftaran_id,
      message: 'Creating new SIM'
    });

    await db(this.tableName).insert({
      ...simData,
      sim_id: simId,
      nomor_sim: nomorSim,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    // Ambil SIM yang baru dibuat dengan creator_name
    const sim = await db(this.tableName)
      .leftJoin('admin', 'sim.created_by', 'admin.admin_id')
      .select('sim.*', 'admin.full_name as creator_name')
      .where('sim.sim_id', simId)
      .first();

    if (!sim) {
      throw new Error('Gagal membuat SIM');
    }

    return toSIMResponse(sim);
  }

  /**
   * Mengambil semua SIM dengan pagination dan search.
   */
  async findAll(
    params: PaginationParams
  ): Promise<PaginationResponse<SIMResponse>> {
    const {
      page,
      limit,
      search,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = params;
    const offset = (page - 1) * limit;

    // Query builder untuk data dengan JOIN ke admin untuk creator_name
    let query = db(this.tableName)
      .leftJoin('admin', 'sim.created_by', 'admin.admin_id')
      .select('sim.*', 'admin.full_name as creator_name');

    // Filter search jika ada
    if (search) {
      query = query.where(function () {
        this.where('sim.nomor_sim', 'like', `%${search}%`)
          .orWhere('sim.pendaftaran_id', 'like', `%${search}%`)
          .orWhere('admin.full_name', 'like', `%${search}%`);
      });
    }

    // Sorting dengan validasi field
    query = this.applySorting(query, sort_by, sort_order);

    // Pagination
    const data = await query.limit(limit).offset(offset);

    // Query untuk total count
    let countQuery = db(this.tableName).leftJoin(
      'admin',
      'sim.created_by',
      'admin.admin_id'
    );
    if (search) {
      countQuery = countQuery.where(function () {
        this.where('sim.nomor_sim', 'like', `%${search}%`)
          .orWhere('sim.pendaftaran_id', 'like', `%${search}%`)
          .orWhere('admin.full_name', 'like', `%${search}%`);
      });
    }

    const [{ count }] = await countQuery.count('* as count');
    const totalItems = parseInt(count as string);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: data.map(toSIMResponse),
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
   * Mengambil SIM berdasarkan ID.
   */
  async findById(simId: string): Promise<SIMResponse | null> {
    const sim = await db(this.tableName)
      .leftJoin('admin', 'sim.created_by', 'admin.admin_id')
      .select('sim.*', 'admin.full_name as creator_name')
      .where('sim.sim_id', simId)
      .first();

    return sim ? toSIMResponse(sim) : null;
  }

  /**
   * Mengambil SIM berdasarkan pendaftaran ID.
   */
  async findByPendaftaranId(
    pendaftaranId: string
  ): Promise<SIMResponse | null> {
    const sim = await db(this.tableName)
      .leftJoin('admin', 'sim.created_by', 'admin.admin_id')
      .select('sim.*', 'admin.full_name as creator_name')
      .where('sim.pendaftaran_id', pendaftaranId)
      .first();

    return sim ? toSIMResponse(sim) : null;
  }

  /**
   * Memperbarui data SIM (hanya tanggal expired dan picture path).
   */
  async update(
    simId: string,
    simData: Partial<
      Pick<SIM, 'tanggal_expired' | 'picture_path' | 'updated_at'>
    >
  ): Promise<SIMResponse | null> {
    const updatedRows = await db(this.tableName)
      .where('sim_id', simId)
      .update({
        ...simData,
        updated_at: db.fn.now()
      });

    if (updatedRows === 0) {
      return null;
    }

    // Ambil SIM yang sudah diupdate dengan creator_name
    const sim = await db(this.tableName)
      .leftJoin('admin', 'sim.created_by', 'admin.admin_id')
      .select('sim.*', 'admin.full_name as creator_name')
      .where('sim.sim_id', simId)
      .first();

    return sim ? toSIMResponse(sim) : null;
  }

  /**
   * Menghapus SIM berdasarkan ID.
   */
  async delete(simId: string): Promise<boolean> {
    const deletedRows = await db(this.tableName).where('sim_id', simId).del();

    return deletedRows > 0;
  }

  /**
   * Mengecek apakah nomor SIM sudah digunakan.
   */
  async isNomorSimExists(
    nomorSim: string,
    excludeSimId?: string
  ): Promise<boolean> {
    let query = db(this.tableName).where('nomor_sim', nomorSim);

    if (excludeSimId) {
      query = query.whereNot('sim_id', excludeSimId);
    }

    const sim = await query.first();
    return !!sim;
  }

  /**
   * Mengecek apakah pendaftaran sudah punya SIM.
   */
  async isPendaftaranHasSIM(pendaftaranId: string): Promise<boolean> {
    const sim = await db(this.tableName)
      .where('pendaftaran_id', pendaftaranId)
      .first();

    return !!sim;
  }
}
