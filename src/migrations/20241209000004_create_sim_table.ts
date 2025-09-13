import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('sim', (table) => {
    table.string('sim_id', 21).primary();
    table.string('nomor_sim', 16).unique().notNullable();
    table.enum('jenis_sim', ['a', 'b1', 'b2', 'c', 'd']).notNullable();
    table.date('tanggal_terbit').notNullable();
    table.date('tanggal_expired').notNullable();
    table.string('ktp_id', 21).notNullable();
    table.string('created_by', 21).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key constraints
    table
      .foreign('ktp_id')
      .references('ktp_id')
      .inTable('ktp')
      .onDelete('CASCADE');

    table
      .foreign('created_by')
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');

    // Indexes
    table.index(['nomor_sim']);
    table.index(['ktp_id']);
    table.index(['created_by']);
    table.index(['jenis_sim']);
    table.index(['tanggal_terbit']);
    table.index(['tanggal_expired']);
    table.index(['tanggal_expired'], 'idx_sim_expired_check');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('sim');
}
