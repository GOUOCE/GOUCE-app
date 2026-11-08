import { z } from 'zod';

export const TITULO_AVISO_MIN = 3;
export const TITULO_AVISO_MAX = 150;
export const DESCRICAO_AVISO_MIN = 3;
export const DESCRICAO_AVISO_MAX = 2000;

export const avisoSchema = z.object({
  titulo: z
    .string({ required_error: 'Título é obrigatório.' })
    .transform((v) => (v || '').trim().replace(/\s+/g, ' '))
    .pipe(
      z
        .string()
        .min(1, 'Título é obrigatório.')
        .min(
          TITULO_AVISO_MIN,
          `O título deve ter pelo menos ${TITULO_AVISO_MIN} caracteres.`
        )
        .max(
          TITULO_AVISO_MAX,
          `O título deve ter no máximo ${TITULO_AVISO_MAX} caracteres.`
        )
    ),
  descricao: z
    .string({ required_error: 'Descrição é obrigatória.' })
    .transform((v) => (v || '').trim())
    .pipe(
      z
        .string()
        .min(1, 'Descrição é obrigatória.')
        .min(
          DESCRICAO_AVISO_MIN,
          `A descrição deve ter pelo menos ${DESCRICAO_AVISO_MIN} caracteres.`
        )
        .max(
          DESCRICAO_AVISO_MAX,
          `A descrição deve ter no máximo ${DESCRICAO_AVISO_MAX} caracteres.`
        )
    ),
});

export type AvisoFormData = z.infer<typeof avisoSchema>;
