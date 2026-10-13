import { z } from 'zod';

export const atribuirRepresentanteSchema = z.object({
  instituicao: z.string().min(1, 'Selecione a instituição de ensino'),
  alunoId: z.number({ required_error: 'Selecione um discente para tornar representante' }),
});

export type AtribuirRepresentanteFormData = z.infer<typeof atribuirRepresentanteSchema>;
