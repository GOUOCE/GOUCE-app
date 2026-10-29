import { z } from 'zod';

const REGEX_NOME_PESSOA = /^[A-Za-zÀ-ÖØ-öø-ÿ'’\- ]+$/;

export const motoristaSchema = z.object({
  nome: z
    .string()
    .transform((v) => (v || '').trim().replace(/\s+/g, ' '))
    .pipe(
      z
        .string()
        .min(3, 'Informe o nome completo com pelo menos 3 caracteres')
        .max(150, 'O nome deve ter no máximo 150 caracteres')
        .refine((v) => REGEX_NOME_PESSOA.test(v), 'Use apenas letras, espaços, hífen ou apóstrofo')
        .refine((v) => {
          const partes = v.split(' ').filter(Boolean);
          const letras = (parte: string) => parte.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '').length;
          return partes.length >= 2 && letras(partes[0]) >= 2 && letras(partes[partes.length - 1]) >= 2;
        }, 'Informe nome e sobrenome completos')
    ),
  telefone: z
    .string()
    .trim()
    .refine((v) => /^(?:\([0-9]{2}\)|[0-9])[0-9 \-]*$/.test(v), 'Informe um telefone válido com DDD')
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(
      z
        .string()
        .min(10, 'Informe um telefone válido com DDD')
        .max(11, 'Informe um telefone válido com DDD')
        .refine((v) => Number(v.slice(0, 2)) >= 11, 'Informe um telefone válido com DDD')
    ),
});

export type MotoristaFormData = z.infer<typeof motoristaSchema>;
