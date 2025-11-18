import db from '../configs/database';
import { nanoid } from 'nanoid';
import { DataPemohon } from '../models/dataPemohon.model';

export class DataPemohonRepository {
  private tableName = 'data_pemohon';

  async create(
    data: Omit<DataPemohon, 'pemohon_id' | 'created_at' | 'updated_at'>
  ): Promise<DataPemohon> {
    const pemohonId = nanoid();

    await db(this.tableName).insert({
      ...data,
      pemohon_id: pemohonId,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    const inserted = await db(this.tableName)
      .where('pemohon_id', pemohonId)
      .first();

    return inserted as DataPemohon;
  }

  async upsertByPendaftaranId(
    pendaftaranId: string,
    data: Omit<
      DataPemohon,
      'pemohon_id' | 'pendaftaran_id' | 'created_at' | 'updated_at'
    >
  ): Promise<DataPemohon> {
    const existing = await this.findByPendaftaranId(pendaftaranId);

    if (existing) {
      await db(this.tableName)
        .where('pendaftaran_id', pendaftaranId)
        .update({ ...data, updated_at: db.fn.now() });

      const updated = await this.findByPendaftaranId(pendaftaranId);
      return updated as DataPemohon;
    }

    return this.create({ ...data, pendaftaran_id: pendaftaranId });
  }

  async findByPendaftaranId(
    pendaftaranId: string
  ): Promise<DataPemohon | null> {
    const row = await db(this.tableName)
      .where('pendaftaran_id', pendaftaranId)
      .first();

    return (row as DataPemohon) ?? null;
  }

  async findByNik(nik: string): Promise<DataPemohon[]> {
    const rows = await db(this.tableName).where('nik', nik);
    return rows as DataPemohon[];
  }

  async update(
    pemohonId: string,
    data: Partial<Omit<DataPemohon, 'pemohon_id' | 'created_at'>>
  ): Promise<DataPemohon | null> {
    const updatedRows = await db(this.tableName)
      .where('pemohon_id', pemohonId)
      .update({ ...data, updated_at: db.fn.now() });

    if (updatedRows === 0) return null;

    const row = await db(this.tableName).where('pemohon_id', pemohonId).first();

    return row as DataPemohon;
  }

  async deleteByPendaftaranId(pendaftaranId: string): Promise<boolean> {
    const deleted = await db(this.tableName)
      .where('pendaftaran_id', pendaftaranId)
      .del();
    return deleted > 0;
  }
}
