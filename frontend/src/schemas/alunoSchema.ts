import { z } from 'zod';

// Configuração global do mapa de erros do Zod em Português (Guia de Validação de Formulários - Seção 2.1)
z.setErrorMap((issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type && issue.received === 'undefined') {
    return { message: 'Campo obrigatório' };
  }
  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: `Informe pelo menos ${issue.minimum} caracteres` };
  }
  if (issue.code === z.ZodIssueCode.too_big) {
    return { message: `Use no máximo ${issue.maximum} caracteres` };
  }
  return { message: ctx.defaultError };
});

const LETRAS = /^[A-Za-zÀ-ÖØ-öø-ÿ'’\-.]+$/;

const DDDS = [
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99
];

export const nomeSchema = z
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

export const emailSchema = z
  .string()
  .transform((v) => (v || '').trim().toLowerCase())
  .pipe(z.string().min(1, 'Informe o e-mail').email('E-mail inválido'));

export const senhaSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(128, 'A senha deve ter no máximo 128 caracteres')
  .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
  .regex(/[a-z]/, 'Inclua pelo menos uma letra minúscula')
  .regex(/[0-9]/, 'Inclua pelo menos um número');

export const dataNascimentoSchema = z
  .string()
  .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Use o formato DD/MM/AAAA')
  .refine((v) => {
    const [d, m, a] = v.split('/').map(Number);
    const data = new Date(a, m - 1, d);
    return data.getFullYear() === a && data.getMonth() === m - 1 && data.getDate() === d;
  }, 'Data inválida')
  .refine((v) => {
    const [d, m, a] = v.split('/').map(Number);
    const hoje = new Date();
    let idade = hoje.getFullYear() - a;
    if (hoje.getMonth() + 1 < m || (hoje.getMonth() + 1 === m && hoje.getDate() < d)) idade--;
    return idade >= 16 && idade <= 120;
  }, 'É preciso ter entre 16 e 120 anos');

export const telefoneSchema = z
  .string()
  .transform((v) => (v || '').replace(/\D/g, ''))
  .pipe(
    z
      .string()
      .length(11, 'Informe DDD e número com 9 dígitos')
      .refine((v) => DDDS.includes(Number(v.slice(0, 2))), 'DDD inválido')
      .refine((v) => v[2] === '9', 'Informe um número de celular (começa com 9)')
      .refine((v) => new Set(v).size > 1, 'Número de telefone inválido')
  );

const fileSchema = z.any().refine((file) => {
  if (!file) return false;
  const target = Array.isArray(file) ? file[0] : (file && file.assets && file.assets[0]) ? file.assets[0] : file;
  if (!target) return false;
  if (target === 'existente' || target?.uri === 'existente') return true;

  const size = target.size || target.fileSize || 1;
  const mime = (target.mimeType || target.type || '').toLowerCase();
  const name = (target.name || target.fileName || '').toLowerCase();

  const isValidType =
    mime.includes('pdf') ||
    mime.includes('image') ||
    mime.includes('png') ||
    mime.includes('jpg') ||
    mime.includes('jpeg') ||
    mime.includes('webp') ||
    name.endsWith('.pdf') ||
    name.endsWith('.png') ||
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.webp');

  const isValidSize = size <= 10 * 1024 * 1024; // 10 MB
  return isValidType && isValidSize;
}, 'Envie PDF ou imagem (PNG, JPG ou WEBP) de até 10 MB');

// Schema do Passo 1 com superRefine de senhas iguais
export const etapa1Schema = z
  .object({
    fotoPerfil: z.any().optional(),
    nomeCompleto: nomeSchema,
    email: emailSchema,
    dataNascimento: dataNascimentoSchema,
    senha: senhaSchema,
    confirmarSenha: z.string().min(1, 'Confirme sua senha'),
  })
  .superRefine((dados, ctx) => {
    if (dados.senha !== dados.confirmarSenha) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmarSenha'],
        message: 'As senhas não coincidem',
      });
    }
  });

export const etapa2Schema = z.object({
  raca: z.string().min(1, 'Selecione a raça'),
  identificacaoSexual: z.string().min(1, 'Selecione a identificação sexual'),
  genero: z.string().min(1, 'Selecione o gênero'),
  transgenero: z.string().min(1, 'Selecione se é transgênero'),
  temFilhos: z.boolean({ required_error: 'Informe se tem filhos' }),
});

export const etapa3Schema = z.object({
  bairro: z.string().min(1, 'Selecione o bairro'),
  whatsapp: telefoneSchema,
  instituicao: z.string().min(1, 'Selecione a instituição'),
  curso: z.string().min(1, 'Selecione o curso'),
  campus: z.string().min(1, 'Selecione o campus'),
  periodoIngresso: z.string().min(1, 'Selecione o período de ingresso'),
  turno: z.string().min(1, 'Selecione o turno'),
  semestreAtual: z.string().min(1, 'Selecione o semestre atual'),
});

export const etapa4Schema = z.object({
  comprovanteMatricula: fileSchema,
  comprovanteResidencia: fileSchema,
});

export const etapa5Schema = z.object({
  aceitouTermos: z.boolean().refine((val) => val === true, 'Você deve aceitar os termos de uso para continuar'),
});

// Schema completo do cadastro de aluno
export const alunoSchema = etapa1Schema
  .and(etapa2Schema)
  .and(etapa3Schema)
  .and(etapa4Schema)
  .and(etapa5Schema);

export type AlunoFormData = z.infer<typeof alunoSchema>;

// Schema da renovação de vínculo
export const renovacaoSchema = z.object({
  fotoPerfil: z.any().optional(),
  nomeCompleto: nomeSchema,
  email: emailSchema,
  dataNascimento: dataNascimentoSchema,
  raca: z.string().min(1, 'Selecione a raça'),
  identificacaoSexual: z.string().min(1, 'Selecione a identificação sexual'),
  genero: z.string().min(1, 'Selecione o gênero'),
  transgenero: z.string().min(1, 'Selecione se é transgênero'),
  temFilhos: z.boolean(),
  bairro: z.string().min(1, 'Selecione o bairro'),
  whatsapp: telefoneSchema,
  instituicao: z.string().min(1, 'Selecione a instituição'),
  curso: z.string().min(1, 'Selecione o curso'),
  campus: z.string().min(1, 'Selecione o campus'),
  periodoIngresso: z.string().min(1, 'Selecione o período de ingresso'),
  turno: z.string().min(1, 'Selecione o turno'),
  semestreAtual: z.string().min(1, 'Selecione o semestre atual'),
  comprovanteMatricula: fileSchema,
  comprovanteResidencia: z.any().optional(),
  aceitouTermos: z.boolean().optional(),
});

export type RenovacaoFormData = z.infer<typeof renovacaoSchema>;
