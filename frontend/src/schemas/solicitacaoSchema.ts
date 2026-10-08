import { z } from 'zod';

export const reprovacaoSchema = z.object({
  motivo: z.string().min(5, 'Informe um motivo detalhado com pelo menos 5 caracteres'),
  documentosReenvio: z.array(z.string()).min(1, 'Selecione ao menos um documento para reenvio'),
});

export type ReprovacaoFormData = z.infer<typeof reprovacaoSchema>;
