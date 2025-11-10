import { z } from 'zod';

/**
 * Schema validasi untuk operasi terkait Satpas.
 */
export class SatpasValidation {
  private static readonly baseSchemas = {
    satpasId: z
      .string()
      .min(1, 'Satpas ID harus diisi')
      .max(21, 'Satpas ID maksimal 21 karakter'),

    name: z
      .string()
      .min(1, 'Nama Satpas harus diisi')
      .max(255, 'Nama Satpas maksimal 255 karakter'),

    latitude: z
      .number({ message: 'Latitude harus berupa angka' })
      .min(-90, 'Latitude minimal -90')
      .max(90, 'Latitude maksimal 90'),

    longitude: z
      .number({ message: 'Longitude harus berupa angka' })
      .min(-180, 'Longitude minimal -180')
      .max(180, 'Longitude maksimal 180')
  };

  static readonly CREATE = z.object({
    name: this.baseSchemas.name,
    latitude: this.baseSchemas.latitude,
    longitude: this.baseSchemas.longitude
  });

  static readonly GET = z.object({
    satpas_id: this.baseSchemas.satpasId
  });

  static readonly UPDATE = z.object({
    satpas_id: this.baseSchemas.satpasId,
    name: this.baseSchemas.name.optional(),
    latitude: this.baseSchemas.latitude.optional(),
    longitude: this.baseSchemas.longitude.optional()
  });

  static readonly DELETE = z.object({
    satpas_id: this.baseSchemas.satpasId
  });
}
