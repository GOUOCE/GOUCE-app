import { z } from 'zod';

export const motoristaSchema = z.object({
  nome: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(3, 'Informe o nome completo com pelo menos 3 caracteres')
        .max(150, 'O nome deve ter no máximo 150 caracteres')
    ),
  telefone: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(10, 'Informe um telefone válido com DDD')
        .max(20, 'O telefone deve ter no máximo 20 caracteres')
    ),
});

export type MotoristaFormData = z.infer<typeof motoristaSchema>;
