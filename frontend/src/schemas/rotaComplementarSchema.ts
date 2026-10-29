import { z } from 'zod';

// Mesmo formato aceito pela API: 00:00 a 23:59, sem faixa mínima ou máxima (#208, item 2b; #357)
const REGEX_HORARIO = /^([01][0-9]|2[0-3]):([0-5][0-9])$/;

function horario(obrigatorio: string) {
  return z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(1, obrigatorio)
        .refine((v) => REGEX_HORARIO.test(v), 'Horário deve estar no formato HH:MM.')
    );
}

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
  horarioSaida: horario('Selecione o horário de saída'),
  horarioRetorno: horario('Selecione o horário de retorno'),
  pontoConexao: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(3, 'Informe o ponto de conexão com pelo menos 3 caracteres')
        .max(150, 'O ponto de conexão deve ter no máximo 150 caracteres')
    ),
}).superRefine((dados, ctx) => {
  // "HH:mm" com zero à esquerda: a comparação de texto segue a ordem do relógio (#208, item 2a)
  if (dados.horarioSaida && dados.horarioRetorno && dados.horarioRetorno <= dados.horarioSaida) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['horarioRetorno'],
      message: 'Horário de retorno deve ser maior que o horário de saída.',
    });
  }
});

export type RotaComplementarFormData = z.infer<typeof rotaComplementarSchema>;
