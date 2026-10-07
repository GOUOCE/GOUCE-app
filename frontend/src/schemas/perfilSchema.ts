import { z } from 'zod';
import { telefoneSchema, emailSchema } from './alunoSchema';

export const editarPerfilSchema = z.object({
  telefone: telefoneSchema,
  bairro: z.string().min(1, 'Selecione o bairro'),
});

export type EditarPerfilFormData = z.infer<typeof editarPerfilSchema>;

export const alterarEmailSchema = z.object({
  emailAtual: emailSchema,
  novoEmail: emailSchema,
  senhaAtual: z.string().min(1, 'Informe sua senha atual por segurança'),
}).refine((data) => data.emailAtual.toLowerCase() !== data.novoEmail.toLowerCase(), {
  message: "O novo e-mail deve ser diferente do e-mail atual",
  path: ["novoEmail"],
});

export type AlterarEmailFormData = z.infer<typeof alterarEmailSchema>;
