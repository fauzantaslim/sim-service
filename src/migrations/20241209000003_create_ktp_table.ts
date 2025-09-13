import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('ktp', (table) => {
    table.string('ktp_id', 21).primary();
    table.string('nik', 16).unique().notNullable();
    table.text('alamat').notNullable();
    table.string('tempat_lahir', 100).notNullable();
    table.date('tanggal_lahir').notNullable();
    table.enum('jenis_kelamin', ['laki_laki', 'perempuan']).notNullable();
    table
      .enum('agama', [
        'islam',
        'kristen',
        'katolik',
        'hindu',
        'buddha',
        'konghucu',
        'lainnya'
      ])
      .notNullable();
    table
      .enum('status_perkawinan', [
        'belum_kawin',
        'kawin',
        'cerai_hidup',
        'cerai_mati'
      ])
      .notNullable();
    table.enum('gol_darah', ['a', 'b', 'ab', 'o', 'tidak_tahu']).notNullable();
    table.string('pekerjaan', 100).notNullable();
    table.string('kewarganegaraan', 50).notNullable();
    table.string('created_by', 21).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key constraint
    table
      .foreign('created_by')
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');

    // Indexes
    table.index(['nik']);
    table.index(['created_by']);
    table.index(['tanggal_lahir']);
    table.index(['jenis_kelamin']);
    table.index(['agama']);
    table.index(['status_perkawinan']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('ktp');
}
