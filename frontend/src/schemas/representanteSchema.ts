import { z } from 'zod';

export const atribuirRepresentanteSchema = z.object({
  instituicao: z.string().min(1, 'Selecione a instituição de ensino'),
  alunoId: z.number({ required_error: 'Busque e selecione um discente' }),
});

export type AtribuirRepresentanteFormData = z.infer<typeof atribuirRepresentanteSchema>;
