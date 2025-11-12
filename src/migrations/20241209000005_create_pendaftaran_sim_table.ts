import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('pendaftaran_sim', (table) => {
    table.string('pendaftaran_id', 21).primary();
    table.string('kode_pendaftaran', 50).unique().notNullable();
    table.string('user_id', 21).notNullable();
    table.string('satpas_id', 21).notNullable();
    table
      .enum('jenis_sim', [
        'a',
        'a_umum',
        'bi',
        'bi_umum',
        'bii',
        'bii_umum',
        'c',
        'ci',
        'cii',
        'd',
        'di'
      ])
      .notNullable();
    table.date('tanggal_ujian').notNullable();
    table
      .enum('status', [
        'diajukan',
        'diperiksa',
        'disetujui',
        'proses_ujian',
        'ujian_gagal',
        'selesai',
        'ditolak'
      ])
      .notNullable()
      .defaultTo('diajukan');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign Keys
    table
      .foreign('user_id')
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');

    table
      .foreign('satpas_id')
      .references('satpas_id')
      .inTable('satpas')
      .onDelete('RESTRICT');

    // Indexes
    table.index(['user_id']);
    table.index(['satpas_id']);
    table.index(['kode_pendaftaran']);
    table.index(['status']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('pendaftaran_sim');
}
