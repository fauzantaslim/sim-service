import type { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

export async function seed(knex: Knex): Promise<void> {
  // Hapus data yang ada
  await knex('users').del();

  // Hash password untuk admin
  const hashedPassword = await bcrypt.hash('password', 10);

  // Insert seed data
  await knex('users').insert([
    {
      user_id: nanoid(21),
      email: 'admin@sim.com',
      full_name: 'Administrator',
      password: hashedPassword,
      is_active: true
    },
    {
      user_id: nanoid(21),
      email: 'user1@sim.com',
      full_name: 'User Satu',
      password: hashedPassword,
      is_active: true
    }
  ]);
}
