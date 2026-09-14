import { z } from 'zod';

export const alunoSchema = z.object({
  // Passo 1: Dados Básicos
  fotoPerfil: z.string().optional(), // URI da imagem
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  dataNascimento: z.string().min(10, 'Data inválida'),
  senha: z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
  confirmarSenha: z.string(),

  // Passo 2: Perfil Demográfico
  raca: z.string().min(1, 'Selecione a raça'),
  identificacaoSexual: z.string().min(1, 'Selecione a identificação sexual'),
  genero: z.string().min(1, 'Selecione o gênero'),
  transgenero: z.string().min(1, 'Selecione se é transgênero'),
  temFilhos: z.boolean(),

  // Passo 3: Contato e Vínculo
  bairro: z.string().min(1, 'Selecione o bairro'),
  whatsapp: z.string().min(10, 'Telefone inválido'),
  instituicao: z.string().min(1, 'Selecione a instituição'),
  curso: z.string().min(1, 'Selecione o curso'),
  campus: z.string().min(1, 'Selecione o campus'),
  periodoIngresso: z.string().min(1, 'Selecione o período'),
  turno: z.string().min(1, 'Selecione o turno'),
  semestreAtual: z.string().min(1, 'Selecione o semestre'),

  // Passo 4: Documentação
  comprovanteMatricula: z.any().refine((file) => file, 'Obrigatório anexar comprovante de matrícula'),
  comprovanteResidencia: z.any().refine((file) => file, 'Obrigatório anexar comprovante de residência'),

  // Aceite
  aceitouTermos: z.boolean().refine((val) => val === true, 'Você deve aceitar os termos de uso'),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

export type AlunoFormData = z.infer<typeof alunoSchema>;
