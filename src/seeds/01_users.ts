import type { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { fakerID_ID as faker } from '@faker-js/faker';

export async function seed(knex: Knex): Promise<void> {
  // Hapus data lama
  await knex('users').del();

  // Hash password default
  const hashedPassword = await bcrypt.hash('password', 10);

  // User default
  const users = [
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
  ];

  // Tambahkan 10 user dummy lokal Indonesia
  for (let i = 0; i < 10; i++) {
    users.push({
      user_id: nanoid(21),
      email: faker.internet.email(),
      full_name: faker.person.fullName(),
      password: hashedPassword, // semua pakai "password"
      is_active: faker.datatype.boolean()
    });
  }

  await knex('users').insert(users);
}
