import { z } from 'zod';

export const frotaSchema = z.object({
  placa: z.string()
    .transform((v) => v.trim().toUpperCase())
    .refine((v) => /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/.test(v), 'Placa inválida.')
    .transform((v) => v.replace('-', '')),
  assentos: z
    .any()
    .refine((v) => v !== undefined && v !== null && String(v).trim() !== '', 'Informe a quantidade de assentos')
    .transform((v) => Number(v))
    .pipe(
      z
        .number({ invalid_type_error: 'A quantidade de assentos deve ser maior que zero' })
        .int('A quantidade de assentos deve ser um número inteiro')
        .min(1, 'A quantidade de assentos deve ser maior que zero')
        .max(100, 'A quantidade de assentos deve ser no máximo 100.')
    ),
  capacidadeEmPe: z
    .any()
    .refine((v) => v !== undefined && v !== null && String(v).trim() !== '', 'Informe a capacidade máxima em pé')
    .transform((v) => Number(v))
    .pipe(
      z
        .number({ invalid_type_error: 'A capacidade em pé não pode ser negativa' })
        .int('A capacidade em pé deve ser um número inteiro')
        .min(0, 'A capacidade em pé não pode ser negativa')
        .max(100, 'A capacidade em pé deve ser no máximo 100.')
    ),
});

export type FrotaFormData = z.infer<typeof frotaSchema>;
