import { z } from 'zod';
import { telefoneSchema } from './alunoSchema';

export const editarPerfilSchema = z.object({
  telefone: telefoneSchema,
  bairro: z.string().min(1, 'Selecione o bairro'),
});

export type EditarPerfilFormData = z.infer<typeof editarPerfilSchema>;

const normalizarEmail = (v: string) => (v || '').trim().toLowerCase();

export const alterarEmailSchema = z.object({
  emailAtual: z.string().transform(normalizarEmail).pipe(z.string().email('E-mail atual inválido')),
  novoEmail: z.string().transform(normalizarEmail).pipe(z.string().email('Informe um e-mail novo válido')),
  senhaAtual: z.string().min(1, 'Informe sua senha atual por segurança'),
}).refine((data) => data.emailAtual !== data.novoEmail, {
  message: "O novo e-mail deve ser diferente do e-mail atual",
  path: ["novoEmail"],
});

export type AlterarEmailFormData = z.infer<typeof alterarEmailSchema>;
