import { z } from 'zod';

export const frotaSchema = z.object({
  placa: z
    .string()
    .transform((v) => (v || '').trim().replace(/[^A-Za-z0-9]/g, '').toUpperCase())
    .pipe(
      z
        .string()
        .min(7, 'Placa inválida.')
        .max(7, 'Placa inválida.')
        .regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, 'Placa inválida.')
    ),
  assentos: z
    .coerce
    .number({ invalid_type_error: 'A quantidade de assentos deve ser maior que zero' })
    .min(1, 'A quantidade de assentos deve ser maior que zero'),
  capacidadeEmPe: z
    .coerce
    .number({ invalid_type_error: 'A capacidade em pé não pode ser negativa' })
    .min(0, 'A capacidade em pé não pode ser negativa'),
});

export type FrotaFormData = z.infer<typeof frotaSchema>;
