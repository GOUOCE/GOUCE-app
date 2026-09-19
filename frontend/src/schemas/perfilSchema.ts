import { z } from 'zod';

export const editarPerfilSchema = z.object({
  email: z.string().min(1, 'O e-mail é obrigatório').email('Informe um e-mail válido'),
  telefone: z.string().min(10, 'O telefone deve ter pelo menos 10 dígitos'),
  bairro: z.string().min(1, 'Selecione o bairro'),
  // Senha atual é obrigatória apenas se o e-mail for alterado
  senhaAtual: z.string().optional(),
});

export type EditarPerfilFormData = z.infer<typeof editarPerfilSchema>;
