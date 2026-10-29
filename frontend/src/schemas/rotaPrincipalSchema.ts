import { z } from 'zod';

// Letras (com acento), números, espaço, hífen, apóstrofo e barra: "Rota Centro - UFC", "Linha 01/02" (#338)
export const REGEX_NOME_ROTA = /^[0-9A-Za-zÀ-ÖØ-öø-ÿ'’/\- ]+$/;

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
