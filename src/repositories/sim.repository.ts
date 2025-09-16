import { SIM } from '../models/sim.model';
import {
  SIMPaginationParams,
  PaginationResponse
} from '../types/pagination.type';
import { SIMResponse, toSIMResponse } from '../types/sim.type';
import db from '../configs/database';
import { nanoid } from 'nanoid';

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
      'full_name',
      'nik',
      'rt',
      'rw',
      'kecamatan',
      'kabupaten',
      'provinsi',
      'jenis_sim',
      'tanggal_expired',
      'jenis_kelamin',
      'gol_darah',
      'tempat_lahir',
      'tanggal_lahir',
      'pekerjaan',
      'created_at',
      'updated_at'
    ]);

    if (sort_by === 'creator_name') {
      return query.orderBy('users.full_name', sort_order);
    } else if (allowedSortFields.has(sort_by)) {
      return query.orderBy(`sim.${sort_by}`, sort_order);
    } else {
      // Default sorting jika field tidak valid
      return query.orderBy('sim.created_at', 'desc');
    }
  }

  /**
   * Membuat SIM baru di database.
   */
  async create(
    simData: Omit<SIM, 'sim_id' | 'created_at' | 'updated_at'>
  ): Promise<SIMResponse> {
    // Generate sim_id menggunakan nanoid
    const simId = nanoid();

    await db(this.tableName).insert({
      ...simData,
      sim_id: simId,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    // Ambil SIM yang baru dibuat dengan creator_name
    const sim = await db(this.tableName)
      .leftJoin('users', 'sim.created_by', 'users.user_id')
      .select('sim.*', 'users.full_name as creator_name')
      .where('sim.sim_id', simId)
      .first();

    if (!sim) {
      throw new Error('Gagal membuat SIM');
    }

    return toSIMResponse(sim);
  }

  /**
   * Mengambil semua SIM dengan pagination, search, dan filter enum.
   */
  async findAll(
    params: SIMPaginationParams
  ): Promise<PaginationResponse<SIMResponse>> {
    const {
      page,
      limit,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
      jenis_sim
    } = params;
    const offset = (page - 1) * limit;

    // Query builder untuk data dengan JOIN ke users untuk creator_name
    let query = db(this.tableName)
      .leftJoin('users', 'sim.created_by', 'users.user_id')
      .select('sim.*', 'users.full_name as creator_name');

    // Filter search jika ada
    if (search) {
      query = query.where(function () {
        this.where('sim.nomor_sim', 'ilike', `%${search}%`)
          .orWhere('sim.nik', 'ilike', `%${search}%`)
          .orWhere('sim.full_name', 'ilike', `%${search}%`)
          .orWhere('sim.kecamatan', 'ilike', `%${search}%`)
          .orWhere('sim.kabupaten', 'ilike', `%${search}%`)
          .orWhere('sim.provinsi', 'ilike', `%${search}%`)
          .orWhere('sim.jenis_sim', 'ilike', `%${search}%`)
          .orWhere('sim.jenis_kelamin', 'ilike', `%${search}%`)
          .orWhere('sim.gol_darah', 'ilike', `%${search}%`)
          .orWhere('sim.tempat_lahir', 'ilike', `%${search}%`)
          .orWhere('sim.pekerjaan', 'ilike', `%${search}%`)
          .orWhere('users.full_name', 'ilike', `%${search}%`);
      });
    }

    // Filter enum jika ada
    if (jenis_sim) {
      query = query.where('sim.jenis_sim', jenis_sim);
    }

    // Sorting dengan validasi field
    query = this.applySorting(query, sort_by, sort_order);

    // Pagination
    const data = await query.limit(limit).offset(offset);

    // Query untuk total count
    let countQuery = db(this.tableName).leftJoin(
      'users',
      'sim.created_by',
      'users.user_id'
    );
    if (search) {
      countQuery = countQuery.where(function () {
        this.where('sim.nomor_sim', 'ilike', `%${search}%`)
          .orWhere('sim.nik', 'ilike', `%${search}%`)
          .orWhere('sim.full_name', 'ilike', `%${search}%`)
          .orWhere('sim.kecamatan', 'ilike', `%${search}%`)
          .orWhere('sim.kabupaten', 'ilike', `%${search}%`)
          .orWhere('sim.provinsi', 'ilike', `%${search}%`)
          .orWhere('sim.jenis_sim', 'ilike', `%${search}%`)
          .orWhere('sim.jenis_kelamin', 'ilike', `%${search}%`)
          .orWhere('sim.gol_darah', 'ilike', `%${search}%`)
          .orWhere('sim.tempat_lahir', 'ilike', `%${search}%`)
          .orWhere('sim.pekerjaan', 'ilike', `%${search}%`)
          .orWhere('users.full_name', 'ilike', `%${search}%`);
      });
    }

    // Filter enum untuk count query
    if (jenis_sim) {
      countQuery = countQuery.where('sim.jenis_sim', jenis_sim);
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
      .leftJoin('users', 'sim.created_by', 'users.user_id')
      .select('sim.*', 'users.full_name as creator_name')
      .where('sim.sim_id', simId)
      .first();

    return sim ? toSIMResponse(sim) : null;
  }

  /**
   * Memperbarui data SIM.
   */
  async update(
    simId: string,
    simData: Partial<Omit<SIM, 'sim_id' | 'created_by' | 'created_at'>>
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
      .leftJoin('users', 'sim.created_by', 'users.user_id')
      .select('sim.*', 'users.full_name as creator_name')
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
   * Mengecek apakah NIK sudah digunakan di tabel sim.
   */
  async isNikExists(nik: string, excludeSimId?: string): Promise<boolean> {
    let query = db(this.tableName).where('nik', nik);

    if (excludeSimId) {
      query = query.whereNot('sim_id', excludeSimId);
    }

    const sim = await query.first();
    return !!sim;
  }
}
