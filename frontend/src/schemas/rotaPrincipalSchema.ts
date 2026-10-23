import { z } from 'zod';

export const rotaPrincipalSchema = z.object({
  nome: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(3, 'Informe o nome da rota com pelo menos 3 caracteres')
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
  horarioRetorno: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(1, 'Selecione o horário de retorno')
    ),
  faculdadesIdaIds: z
    .array(z.number())
    .min(1, 'Selecione ao menos uma faculdade de ida'),
  faculdadesVoltaIds: z
    .array(z.number())
    .min(1, 'Selecione ao menos uma faculdade de volta'),
  bairrosIds: z
    .array(z.number())
    .min(1, 'Vincule ao menos um bairro à rota'),
});

export type RotaPrincipalFormData = z.infer<typeof rotaPrincipalSchema>;
