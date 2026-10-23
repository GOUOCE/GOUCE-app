import { z } from 'zod';

export const rotaComplementarSchema = z.object({
  rotaPrincipalId: z
    .coerce
    .number({ invalid_type_error: 'Selecione a rota principal vinculada' })
    .min(1, 'Selecione a rota principal vinculada'),
  nome: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(3, 'Informe o nome da rota complementar com pelo menos 3 caracteres')
        .max(150, 'O nome deve ter no máximo 150 caracteres')
    ),
  horarioSaida: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(1, 'Selecione o horário de saída')
    ),
  pontoConexao: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(3, 'Informe o ponto de conexão com pelo menos 3 caracteres')
        .max(150, 'O ponto de conexão deve ter no máximo 150 caracteres')
    ),
});

export type RotaComplementarFormData = z.infer<typeof rotaComplementarSchema>;
