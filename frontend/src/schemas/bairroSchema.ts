import { z } from 'zod';

export const bairroSchema = z.object({
  nome: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(3, 'Informe o nome do bairro com pelo menos 3 caracteres')
        .max(100, 'O nome do bairro deve ter no máximo 100 caracteres')
    ),
  pontos: z
    .array(z.string().min(1, 'Nome do ponto inválido'))
    .min(1, 'Adicione ao menos um ponto de parada'),
});

export type BairroFormData = z.infer<typeof bairroSchema>;
