import type { Knex } from 'knex';
import { nanoid } from 'nanoid';
import { fakerID_ID as faker } from '@faker-js/faker';

export async function seed(knex: Knex): Promise<void> {
  // Hapus data lama
  await knex('sim').del();

  // Ambil satu user untuk created_by
  const user = await knex('users').first('user_id');
  if (!user) {
    throw new Error(
      'Tidak ada user di tabel users. Jalankan seeder users terlebih dahulu.'
    );
  }

  const sims = [];
  const jenisSim = ['a', 'b1', 'b2', 'c', 'c1', 'c2', 'd'];
  const golDarah = ['A', 'B', 'AB', 'O'];

  for (let i = 0; i < 50; i++) {
    sims.push({
      sim_id: nanoid(21),
      nomor_sim: faker.string.numeric({ length: 16 }),
      full_name: faker.person.fullName(),
      rt: faker.string.numeric({ length: 2 }),
      rw: faker.string.numeric({ length: 2 }),
      kecamatan: faker.location.city(),
      kabupaten: faker.location.city(),
      provinsi: faker.location.state(),
      nik: faker.string.numeric({ length: 16 }),
      jenis_sim: faker.helpers.arrayElement(jenisSim),
      tanggal_expired: faker.date.future({ years: 10 }),
      jenis_kelamin:
        faker.person.sexType() === 'male' ? 'Laki-laki' : 'Perempuan',
      gol_darah: faker.helpers.arrayElement(golDarah),
      tempat_lahir: faker.location.city(),
      tanggal_lahir: faker.date.birthdate({ min: 18, max: 60, mode: 'age' }),
      pekerjaan: faker.person.jobTitle(),
      picture_path: `/uploads/sim/${faker.string.alphanumeric(10)}.jpg`,
      created_by: user.user_id
    });
  }

  await knex('sim').insert(sims);
}
