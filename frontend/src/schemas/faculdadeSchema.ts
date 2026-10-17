import { z } from 'zod';

export const faculdadeSchema = z.object({
  nome: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(3, 'Informe o nome da instituição com pelo menos 3 caracteres')
        .max(150, 'O nome da instituição deve ter no máximo 150 caracteres')
    ),
  sigla: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(2, 'Informe a sigla do nome (ex.: UFC)')
        .max(20, 'A sigla deve ter no máximo 20 caracteres')
    ),
  campus: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(2, 'Informe o campus da instituição')
        .max(100, 'O campus deve ter no máximo 100 caracteres')
    ),
});

export type FaculdadeFormData = z.infer<typeof faculdadeSchema>;
