import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('sim', (table) => {
    table.string('sim_id', 21).primary();
    table.string('nomor_sim', 16).unique().notNullable();
    table.string('full_name', 255).notNullable();
    table.string('rt', 3).notNullable();
    table.string('rw', 3).notNullable();
    table.string('kecamatan', 255).notNullable();
    table.string('kabupaten', 255).notNullable();
    table.string('provinsi', 255).notNullable();
    table.string('nik', 16).notNullable();
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
    table.unique(['nik', 'jenis_sim']); // kombinasi unik
    table.date('tanggal_expired').notNullable();
    table.string('jenis_kelamin', 20).notNullable();
    table.string('gol_darah', 10).notNullable();
    table.string('tempat_lahir', 100).notNullable();
    table.date('tanggal_lahir').notNullable();
    table.string('pekerjaan', 255).notNullable();
    table.string('picture_path', 255).notNullable();
    table.string('created_by', 21).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table
      .foreign('created_by')
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('sim');
}
