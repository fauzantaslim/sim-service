import type { Knex } from 'knex';
import { nanoid } from 'nanoid';
import { fakerID_ID as faker } from '@faker-js/faker';
import { generateNomorSIM } from '../utils/sim-generator';

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
  const jenisSim = [
    'a',
    'a_umum',
    'bi',
    'bi_umum',
    'bii',
    'bii_umum',
    'c',
    'ci',
    'cii',
    'd',
    'di'
  ];
  const golDarah = ['A', 'B', 'AB', 'O'];
  const jenisKelaminOptions = ['laki_laki', 'perempuan'];

  // Track nomor urut per kombinasi NIK + jenis kelamin + tanggal lahir
  const sequenceTracker = new Map<string, number>();

  for (let i = 0; i < 50; i++) {
    // Generate data personal
    const nik = faker.string.numeric({ length: 16 });
    const jenisKelamin = faker.helpers.arrayElement(jenisKelaminOptions);
    const tanggalLahir = faker.date.birthdate({
      min: 18,
      max: 60,
      mode: 'age'
    });

    // Generate base pattern untuk tracking sequence
    const basePattern =
      nik.substring(0, 6) +
      (jenisKelamin === 'perempuan'
        ? (tanggalLahir.getDate() + 40).toString().padStart(2, '0')
        : tanggalLahir.getDate().toString().padStart(2, '0')) +
      (tanggalLahir.getMonth() + 1).toString().padStart(2, '0') +
      (tanggalLahir.getFullYear() % 100).toString().padStart(2, '0');

    // Get atau increment nomor urut untuk pattern ini
    const currentSequence = sequenceTracker.get(basePattern) || 0;
    const nomorUrut = currentSequence + 1;
    sequenceTracker.set(basePattern, nomorUrut);

    // Generate nomor SIM menggunakan utility function
    const nomorSIM = generateNomorSIM(
      nik,
      jenisKelamin,
      tanggalLahir,
      nomorUrut
    );

    sims.push({
      sim_id: nanoid(21),
      nomor_sim: nomorSIM,
      full_name: faker.person.fullName(),
      rt: faker.string.numeric({ length: 2 }),
      rw: faker.string.numeric({ length: 2 }),
      kecamatan: faker.location.city(),
      kabupaten: faker.location.city(),
      provinsi: faker.location.state(),
      nik: nik,
      jenis_sim: faker.helpers.arrayElement(jenisSim),
      tanggal_expired: faker.date.future({ years: 10 }),
      jenis_kelamin: jenisKelamin,
      gol_darah: faker.helpers.arrayElement(golDarah),
      tempat_lahir: faker.location.city(),
      tanggal_lahir: tanggalLahir,
      pekerjaan: faker.person.jobTitle(),
      picture_path: faker.image.avatar(),
      created_by: user.user_id
    });
  }

  await knex('sim').insert(sims);
}
