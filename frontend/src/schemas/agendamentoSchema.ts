import { z } from 'zod';

export const agendamentoDiaSchema = z
  .object({
    dataIso: z.string().min(1, 'Selecione uma data para agendamento'),
    usaIda: z.boolean(),
    pontoEmbarqueIda: z.string().optional(),
    faculdadeDestinoIda: z.string().optional(),
    rotaComplementarIda: z.string().optional(),
    usaVolta: z.boolean(),
    pontoDesembarqueVolta: z.string().optional(),
    faculdadeOrigemVolta: z.string().optional(),
    rotaComplementarVolta: z.string().optional(),
  })
  .superRefine((dados, ctx) => {
    // FA-003 (Requisitos Atualizados): Se 'Sim' para Ida, exige ponto de embarque e faculdade (IES) de destino
    if (dados.usaIda) {
      if (!dados.pontoEmbarqueIda || dados.pontoEmbarqueIda.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pontoEmbarqueIda'],
          message: 'Selecione o ponto de embarque',
        });
      }
      if (!dados.faculdadeDestinoIda || dados.faculdadeDestinoIda.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['faculdadeDestinoIda'],
          message: 'Selecione a faculdade (IES) de destino',
        });
      }
    }

    // FA-003 (Requisitos Atualizados): Se 'Sim' para Volta, exige ponto de desembarque e faculdade (IES) de origem
    if (dados.usaVolta) {
      if (!dados.pontoDesembarqueVolta || dados.pontoDesembarqueVolta.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['pontoDesembarqueVolta'],
          message: 'Selecione o ponto de desembarque',
        });
      }
      if (!dados.faculdadeOrigemVolta || dados.faculdadeOrigemVolta.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['faculdadeOrigemVolta'],
          message: 'Selecione a faculdade (IES) de origem',
        });
      }
    }
  });

export type AgendamentoDiaFormData = z.infer<typeof agendamentoDiaSchema>;
