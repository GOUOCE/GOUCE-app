import { z } from 'zod';

export const frotaSchema = z.object({
  placa: z
    .string()
    .transform((v) => (v || '').trim().toUpperCase())
    .pipe(
      z
        .string()
        .min(7, 'Informe uma placa válida (ex.: OCR-1234)')
        .max(10, 'A placa deve ter no máximo 10 caracteres')
    ),
  assentos: z
    .coerce
    .number({ invalid_type_error: 'Informe a quantidade de assentos' })
    .min(1, 'A quantidade de assentos deve ser maior que zero'),
  capacidadeEmPe: z
    .coerce
    .number({ invalid_type_error: 'Informe a capacidade de alunos em pé' })
    .min(0, 'A capacidade em pé não pode ser negativa'),
});

export type FrotaFormData = z.infer<typeof frotaSchema>;
