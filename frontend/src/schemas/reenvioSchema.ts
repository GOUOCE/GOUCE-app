import { z } from 'zod';

export const reenvioDocumentosSchema = z.object({
  fotoPerfil: z.any().optional(),
  comprovanteMatricula: z.any().optional(),
  comprovanteResidencia: z.any().optional(),
}).refine((dados) => dados.fotoPerfil || dados.comprovanteMatricula || dados.comprovanteResidencia, {
  message: 'Selecione ao menos um documento para reenvio',
  path: ['comprovanteMatricula'],
});

export type ReenvioDocumentosFormData = z.infer<typeof reenvioDocumentosSchema>;
