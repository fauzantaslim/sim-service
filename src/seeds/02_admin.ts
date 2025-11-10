import type { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

export async function seed(knex: Knex): Promise<void> {
  // Hapus data lama
  await knex('admin').del();

  // Hash password default
  const hashedPassword = await bcrypt.hash('password', 10);

  // Data admin default
  const adminData = {
    admin_id: nanoid(21),
    email: 'admin@example.com',
    full_name: 'Super Administrator',
    password: hashedPassword
  };

  // Masukkan data admin
  await knex('admin').insert(adminData);
}
