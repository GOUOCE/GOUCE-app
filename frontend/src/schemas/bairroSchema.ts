import { z } from 'zod';

const REGEX_BAIRRO = /^[A-Za-zÀ-ÖØ-öø-ÿ'’\-. ]+$/;
const REGEX_PONTO = /^[A-Za-z0-9À-ÖØ-öø-ÿ'’\-. ]+$/;

export const pontoParadaSchema = z
  .string()
  .transform((v) => (v || '').trim())
  .pipe(
    z
      .string()
      .min(2, 'Informe um nome de ponto com pelo menos 2 caracteres')
      .max(100, 'O ponto de parada deve ter no máximo 100 caracteres')
      .refine((v) => REGEX_PONTO.test(v), 'Use apenas letras, números, espaços, hífen, apóstrofo ou ponto')
  );

export const bairroSchema = z.object({
  nome: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(3, 'Informe o nome do bairro com pelo menos 3 caracteres')
        .max(100, 'O nome do bairro deve ter no máximo 100 caracteres')
        .refine((v) => REGEX_BAIRRO.test(v), 'Use apenas letras, espaços, hífen ou apóstrofo')
    ),
  pontos: z
    .array(pontoParadaSchema)
    .min(1, 'Adicione ao menos um ponto de parada'),
});

export type BairroFormData = z.infer<typeof bairroSchema>;
