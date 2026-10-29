import { z } from 'zod';

const REGEX_TEXTO_LIVRE = /^[A-Za-z0-9À-ÖØ-öø-ÿ'’\-. ]+$/;
const REGEX_SIGLA = /^[A-Za-z0-9]+$/;

export const faculdadeSchema = z.object({
  nome: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(3, 'Informe o nome da instituição com pelo menos 3 caracteres')
        .max(150, 'O nome da instituição deve ter no máximo 150 caracteres')
        .refine((v) => REGEX_TEXTO_LIVRE.test(v), 'Use apenas letras, números, espaços, hífen, apóstrofo ou ponto')
    ),
  sigla: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(2, 'Informe a sigla do nome (ex.: UFC)')
        .max(20, 'A sigla deve ter no máximo 20 caracteres')
        .refine((v) => REGEX_SIGLA.test(v), 'Use apenas letras e números na sigla, sem espaços')
    ),
  campus: z
    .string()
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(2, 'Informe o campus da instituição')
        .max(100, 'O campus deve ter no máximo 100 caracteres')
        .refine((v) => REGEX_TEXTO_LIVRE.test(v), 'Use apenas letras, números, espaços, hífen, apóstrofo ou ponto')
    ),
});

export type FaculdadeFormData = z.infer<typeof faculdadeSchema>;
