import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('sessions', (table) => {
    table.increments('session_id').primary();
    table.string('refresh_token', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.string('user_agent', 255);
    table.string('ip_address', 25);
    table.string('user_id', 21).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('revoked_at');

    // Foreign key constraint
    table
      .foreign('user_id')
      .references('user_id')
      .inTable('users')
      .onDelete('CASCADE');

    // Indexes
    table.index(['user_id']);
    table.index(['refresh_token']);
    table.index(['expires_at']);
    table.index(['revoked_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('sessions');
}
