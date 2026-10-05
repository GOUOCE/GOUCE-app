import { z } from 'zod';

const LETRAS = /^[A-Za-zÀ-ÖØ-öø-ÿ'’\-.]+$/;

export const adminNomeSchema = z
  .string()
  .transform((v) => (v || '').trim().replace(/\s+/g, ' ').replace(/’/g, "'"))
  .pipe(
    z
      .string()
      .min(3, 'Informe seu nome completo')
      .max(150, 'O nome deve ter no máximo 150 caracteres')
      .refine((v) => v.split(' ').every((p) => LETRAS.test(p)), 'Use apenas letras, espaços, hífen ou apóstrofo')
      .refine((v) => {
        const partes = v.split(' ');
        if (partes.length < 2) return false;
        const primeira = partes[0].replace(/[^A-Za-zÀ-ÿ]/g, '');
        const ultima = partes[partes.length - 1].replace(/[^A-Za-zÀ-ÿ]/g, '');
        return primeira.length >= 2 && ultima.length >= 2;
      }, 'Informe nome e sobrenome completos')
  );

export const adminEmailSchema = z
  .string()
  .transform((v) => (v || '').trim().toLowerCase())
  .pipe(z.string().min(1, 'Informe o e-mail').email('E-mail inválido'));

export const criarAdminSchema = z.object({
  nome: adminNomeSchema,
  email: adminEmailSchema,
});

export type CriarAdminFormData = z.infer<typeof criarAdminSchema>;

export const editarAdminSchema = z.object({
  nome: adminNomeSchema,
  email: adminEmailSchema,
});

export type EditarAdminFormData = z.infer<typeof editarAdminSchema>;
