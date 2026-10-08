import { z } from 'zod';

const passwordRules = z.string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres')
  .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Inclua pelo menos um número');

export const emailLoginSchema = z
  .string()
  .transform((v) => (v || '').trim().toLowerCase())
  .pipe(z.string().min(1, 'O e-mail é obrigatório').email('Informe um e-mail válido'));

export const loginSchema = z.object({
  email: emailLoginSchema,
  senha: z.string().min(1, 'A senha é obrigatória'),
});

export const forgotPasswordSchema = z.object({
  email: emailLoginSchema,
});

export const resetPasswordSchema = z.object({
  novaSenha: passwordRules,
  confirmarNovaSenha: z.string().min(1, 'Confirme sua nova senha'),
}).superRefine((data, ctx) => {
  if (data.novaSenha !== data.confirmarNovaSenha) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmarNovaSenha'],
      message: 'As senhas não coincidem',
    });
  }
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
