import type { Knex } from 'knex';
import { nanoid } from 'nanoid';

export async function seed(knex: Knex): Promise<void> {
  await knex('satpas').del();

  const satpas = [
    {
      satpas_id: nanoid(21),
      name: 'SATPAS Bogor',
      latitude: -6.595038,
      longitude: 106.816635
    },
    {
      satpas_id: nanoid(21),
      name: 'SATPAS Jakarta Pusat',
      latitude: -6.17511,
      longitude: 106.865036
    },
    {
      satpas_id: nanoid(21),
      name: 'SATPAS Bandung',
      latitude: -6.917464,
      longitude: 107.619123
    },
    {
      satpas_id: nanoid(21),
      name: 'SATPAS Surabaya',
      latitude: -7.257472,
      longitude: 112.75209
    },
    {
      satpas_id: nanoid(21),
      name: 'SATPAS Yogyakarta',
      latitude: -7.79558,
      longitude: 110.36949
    },
    {
      satpas_id: nanoid(21),
      name: 'SATPAS Medan',
      latitude: 3.595196,
      longitude: 98.672226
    },
    {
      satpas_id: nanoid(21),
      name: 'SATPAS Makassar',
      latitude: -5.147665,
      longitude: 119.432732
    },
    {
      satpas_id: nanoid(21),
      name: 'SATPAS Denpasar',
      latitude: -8.65,
      longitude: 115.216667
    }
  ];

  await knex('satpas').insert(satpas);
}
