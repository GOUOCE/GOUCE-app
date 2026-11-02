import { z } from 'zod';

export const agendamentoDiaSchema = z
  .object({
    dataIso: z.string().min(1, 'Selecione uma data para agendamento'),
    usaIda: z.boolean(),
    horarioIda: z.string().optional(),
    pontoEmbarqueIda: z.string().optional(),
    faculdadeDestinoIda: z.string().optional(),
    rotaComplementarIda: z.string().optional(),
    usaVolta: z.boolean(),
    horarioVolta: z.string().optional(),
    pontoDesembarqueVolta: z.string().optional(),
    faculdadeOrigemVolta: z.string().optional(),
    rotaComplementarVolta: z.string().optional(),
  })
  .superRefine((dados, ctx) => {
    // FA-003: Se marcou Sim para Ida, exige horário, ponto de embarque e IES de destino
    if (dados.usaIda) {
      if (!dados.horarioIda || dados.horarioIda.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['horarioIda'],
          message: 'Selecione o horário de ida',
        });
      }
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

    // FA-003: Se marcou Sim para Volta, exige horário, ponto de desembarque e IES de origem
    if (dados.usaVolta) {
      if (!dados.horarioVolta || dados.horarioVolta.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['horarioVolta'],
          message: 'Selecione o horário de volta',
        });
      }
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
