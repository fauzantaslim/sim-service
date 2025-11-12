import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('sim', (table) => {
    table.string('sim_id', 21).primary();
    table.string('nomor_sim', 16).unique().notNullable();
    table.string('pendaftaran_id', 21).notNullable();
    table.date('tanggal_terbit').notNullable();
    table.date('tanggal_expired').notNullable();
    table.string('picture_path', 255).notNullable();
    table.string('created_by', 21).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign Keys
    table
      .foreign('pendaftaran_id')
      .references('pendaftaran_id')
      .inTable('pendaftaran_sim')
      .onDelete('RESTRICT');

    table
      .foreign('created_by')
      .references('admin_id')
      .inTable('admin')
      .onDelete('RESTRICT');

    // Indexes
    table.index(['pendaftaran_id']);
    table.index(['created_by']);
    table.index(['nomor_sim']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('sim');
}
