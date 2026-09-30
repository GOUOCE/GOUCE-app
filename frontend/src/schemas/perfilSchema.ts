import { z } from 'zod';

export const editarPerfilSchema = z.object({
  telefone: z.string().min(10, 'O telefone deve ter pelo menos 10 dígitos com DDD'),
  bairro: z.string().min(1, 'Selecione o bairro'),
});

export type EditarPerfilFormData = z.infer<typeof editarPerfilSchema>;

export const alterarEmailSchema = z.object({
  emailAtual: z.string().email('E-mail atual inválido'),
  novoEmail: z.string().email('Informe um e-mail novo válido'),
  senhaAtual: z.string().min(1, 'Informe sua senha atual por segurança'),
}).refine((data) => data.emailAtual.toLowerCase() !== data.novoEmail.toLowerCase(), {
  message: "O novo e-mail deve ser diferente do e-mail atual",
  path: ["novoEmail"],
});

export type AlterarEmailFormData = z.infer<typeof alterarEmailSchema>;
