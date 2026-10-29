import { z } from 'zod';

// Letras (com acento), números, espaço, hífen, apóstrofo e barra: "Rota Centro - UFC", "Linha 01/02" (#338)
export const REGEX_NOME_ROTA = /^[0-9A-Za-zÀ-ÖØ-öø-ÿ'’/\- ]+$/;

// Mesmo formato aceito pela API: 00:00 a 23:59, sem faixa mínima ou máxima (#208, item 2b; #340)
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

export const rotaPrincipalSchema = z.object({
  nome: z
    .string()
    .transform((v) => (v || '').trim().replace(/\s+/g, ' '))
    .pipe(
      z
        .string()
        .min(3, 'Informe o nome da rota com pelo menos 3 caracteres')
        .max(150, 'O nome deve ter no máximo 150 caracteres')
        .refine((v) => REGEX_NOME_ROTA.test(v), 'Use apenas letras, números, espaços, hífen, apóstrofo ou barra')
    ),
  horarioSaida: horario('Horário de saída é obrigatório.'),
  horarioRetorno: horario('Horário de retorno é obrigatório.'),
  faculdadesIdaIds: z
    .array(z.number())
    .min(1, 'Selecione ao menos uma faculdade de ida'),
  faculdadesVoltaIds: z
    .array(z.number())
    .min(1, 'Selecione ao menos uma faculdade de volta'),
  bairrosIds: z
    .array(z.number())
    .min(1, 'Vincule ao menos um bairro à rota'),
}).superRefine((dados, ctx) => {
  // "HH:mm" com zero à esquerda: a comparação de texto segue a ordem do relógio (#208, item 2a)
  if (dados.horarioRetorno <= dados.horarioSaida) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['horarioRetorno'],
      message: 'Horário de retorno deve ser maior que o horário de saída.',
    });
  }
});

export type RotaPrincipalFormData = z.infer<typeof rotaPrincipalSchema>;
