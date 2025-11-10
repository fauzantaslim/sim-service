import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('otp_codes', (table) => {
    table.increments('id').primary();
    table.string('phone_number', 20).notNullable();
    table.string('otp_code', 255).notNullable(); // Increased length to store bcrypt hash
    table.timestamp('expires_at').notNullable();
    table.boolean('is_used').defaultTo(false);
    table.integer('attempts').defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['phone_number', 'is_used']);
    table.index(['expires_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('otp_codes');
}
