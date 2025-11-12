import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('data_pemohon', (table) => {
    table.string('pemohon_id', 21).primary();
    table.string('pendaftaran_id', 21).notNullable();
    table.string('full_name', 255).notNullable();
    table.string('nik', 16).notNullable();
    table.string('tempat_lahir', 100).notNullable();
    table.date('tanggal_lahir').notNullable();
    table.string('jenis_kelamin', 20).notNullable();
    table.string('gol_darah', 10).notNullable();
    table.string('pekerjaan', 255).notNullable();
    table.string('alamat_rt', 3).notNullable();
    table.string('alamat_rw', 3).notNullable();
    table.string('kecamatan', 255).notNullable();
    table.string('kabupaten', 255).notNullable();
    table.string('provinsi', 255).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign Key
    table
      .foreign('pendaftaran_id')
      .references('pendaftaran_id')
      .inTable('pendaftaran_sim')
      .onDelete('CASCADE');

    // Indexes
    table.index(['pendaftaran_id']);
    table.index(['nik']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('data_pemohon');
}
