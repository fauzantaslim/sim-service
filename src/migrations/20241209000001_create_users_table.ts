import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.string('user_id', 21).primary();
    table.string('nik', 16);
    table.string('email', 255);
    table.string('full_name', 255);
    table.string('phone_number', 20).notNullable();
    table.string('pin', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['email']);
    table.index(['nik']);
    table.index(['phone_number']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
