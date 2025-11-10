import type { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import { fakerID_ID as faker } from '@faker-js/faker';

export async function seed(knex: Knex): Promise<void> {
  // Hapus data lama
  await knex('users').del();

  // Hash PIN default
  const hashedPin = await bcrypt.hash('123456', 10);

  // User default
  const users = [
    {
      user_id: nanoid(21),
      full_name: 'User Satu',
      phone_number: '081234567890',
      pin: hashedPin
    }
  ];

  // Tambahkan 10 user dummy lokal Indonesia
  for (let i = 0; i < 10; i++) {
    users.push({
      user_id: nanoid(21),
      full_name: faker.person.fullName(),
      phone_number: faker.phone.number(),
      pin: hashedPin // Semua pakai PIN "123456"
    });
  }

  await knex('users').insert(users);
}
