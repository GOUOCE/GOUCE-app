import { describe, it, expect } from '@jest/globals';
import {
  alunoSchema,
  etapa1Schema,
  etapa2Schema,
  etapa3Schema,
  etapa4Schema,
  etapa5Schema,
  nomeSchema,
  emailSchema,
  senhaSchema,
  dataNascimentoSchema,
  telefoneSchema,
  renovacaoSchema,
} from '../alunoSchema';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../loginSchema';
import { editarPerfilSchema, alterarEmailSchema } from '../perfilSchema';

describe('Suíte de Testes Unitários Completa - HU-001 (Solicitação de Cadastro de Aluno)', () => {

  // ---------------------------------------------------------------------------
  // PASSO 1: DADOS BÁSICOS
  // ---------------------------------------------------------------------------
  describe('Passo 1 - Nome Completo (nomeSchema) - Issues #52, #55, #56, #57', () => {
    it('deve aprovar nome completo válido com nome e sobrenome', () => {
      const res = nomeSchema.safeParse('João Silva Neves');
      expect(res.success).toBe(true);
    });

    it('deve aceitar nomes compostos com hífen (ex: Ana-Maria Silva)', () => {
      const res = nomeSchema.safeParse('Ana-Maria Silva');
      expect(res.success).toBe(true);
    });

    it('deve aceitar apóstrofos padrão e tipográficos do teclado do iOS (ex: D’Ávila)', () => {
      const res1 = nomeSchema.safeParse("Maria D'Ávila");
      const res2 = nomeSchema.safeParse('Maria D’Ávila');
      expect(res1.success).toBe(true);
      expect(res2.success).toBe(true);
    });

    it('deve aceitar nomes do meio abreviados ou preposições (ex: João P. da Silva)', () => {
      const res = nomeSchema.safeParse('João P. da Silva');
      expect(res.success).toBe(true);
    });

    it('deve recusar nomes com apenas espaços', () => {
      const res = nomeSchema.safeParse('     ');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Informe seu nome completo');
      }
    });

    it('deve recusar nomes sem sobrenome (apenas um nome)', () => {
      const res = nomeSchema.safeParse('João');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Informe nome e sobrenome completos');
      }
    });

    it('deve recusar nomes fictícios de duas letras como "A B"', () => {
      const res = nomeSchema.safeParse('A B');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Informe nome e sobrenome completos');
      }
    });

    it('deve recusar nomes contendo números ou símbolos inválidos', () => {
      const res = nomeSchema.safeParse('João Silva 123');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Use apenas letras, espaços, hífen ou apóstrofo');
      }
    });

    it('deve recusar nomes com mais de 150 caracteres', () => {
      const nomeLongo = 'A'.repeat(151) + ' Silva';
      const res = nomeSchema.safeParse(nomeLongo);
      expect(res.success).toBe(false);
    });
  });

  describe('Passo 1 - E-mail (emailSchema) - Issue #51', () => {
    it('deve sanitizar e-mail removendo espaços e convertendo para minúsculas', () => {
      const res = emailSchema.safeParse('   ALUNO.TESTE@EMAIL.COM   ');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('aluno.teste@email.com');
      }
    });

    it('deve recusar e-mail em branco', () => {
      const res = emailSchema.safeParse('  ');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Informe o e-mail');
      }
    });

    it('deve recusar formatos de e-mail inválidos sem @ ou domínio', () => {
      const res1 = emailSchema.safeParse('alunotestecom');
      const res2 = emailSchema.safeParse('aluno@com');
      expect(res1.success).toBe(false);
      expect(res2.success).toBe(false);
    });
  });

  describe('Passo 1 - Senha e Confirmação (senhaSchema) - AC-03 HU-001', () => {
    it('deve aprovar senha com 8+ caracteres, maiúscula, minúscula e número', () => {
      const res = senhaSchema.safeParse('Aluno123Senha');
      expect(res.success).toBe(true);
    });

    it('deve recusar senhas com menos de 8 caracteres', () => {
      const res = senhaSchema.safeParse('Senha1');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('A senha deve ter pelo menos 8 caracteres');
      }
    });

    it('deve recusar senhas sem letra maiúscula', () => {
      const res = senhaSchema.safeParse('aluno123senha');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Inclua pelo menos uma letra maiúscula');
      }
    });

    it('deve recusar senhas sem letra minúscula', () => {
      const res = senhaSchema.safeParse('ALUNO123SENHA');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Inclua pelo menos uma letra minúscula');
      }
    });

    it('deve recusar senhas sem números', () => {
      const res = senhaSchema.safeParse('AlunoSenhaSoLetras');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Inclua pelo menos um número');
      }
    });
  });

  describe('Passo 1 - Data de Nascimento (dataNascimentoSchema) - Issues #54, #67', () => {
    it('deve aprovar data real válida para aluno com idade entre 16 e 120 anos', () => {
      const res = dataNascimentoSchema.safeParse('15/05/2002');
      expect(res.success).toBe(true);
    });

    it('deve recusar datas em formatos incorretos', () => {
      const res = dataNascimentoSchema.safeParse('2002-05-15');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Use o formato DD/MM/AAAA');
      }
    });

    it('deve recusar datas inexistentes no calendário (ex: 31/02/2002)', () => {
      const res = dataNascimentoSchema.safeParse('31/02/2002');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Data inválida');
      }
    });

    it('deve recusar idades menores que 16 anos', () => {
      const hoje = new Date();
      const anoInvalido = hoje.getFullYear() - 10;
      const res = dataNascimentoSchema.safeParse(`15/05/${anoInvalido}`);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('É preciso ter entre 16 e 120 anos');
      }
    });

    it('deve recusar idades maiores que 120 anos', () => {
      const res = dataNascimentoSchema.safeParse('15/05/1890');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('É preciso ter entre 16 e 120 anos');
      }
    });
  });

  describe('Passo 1 Integrado (etapa1Schema) - Issue #53', () => {
    it('deve acusar erro de divergência de senhas diretamente na Etapa 1', () => {
      const dadosIncompatíveis = {
        nomeCompleto: 'João Silva Neves',
        email: 'joao.neves@gmail.com',
        dataNascimento: '15/05/2002',
        senha: 'Aluno123Senha',
        confirmarSenha: 'OutraSenha123',
      };
      const res = etapa1Schema.safeParse(dadosIncompatíveis);
      expect(res.success).toBe(false);
      if (!res.success) {
        const erroConfirmacao = res.error.issues.find((i) => i.path.includes('confirmarSenha'));
        expect(erroConfirmacao).toBeDefined();
        expect(erroConfirmacao?.message).toBe('As senhas não coincidem');
      }
    });

    it('deve aprovar a Etapa 1 quando todos os campos e senhas forem idênticos', () => {
      const dadosValidos = {
        nomeCompleto: 'João Silva Neves',
        email: 'joao.neves@gmail.com',
        dataNascimento: '15/05/2002',
        senha: 'Aluno123Senha',
        confirmarSenha: 'Aluno123Senha',
      };
      const res = etapa1Schema.safeParse(dadosValidos);
      expect(res.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // PASSO 2: PERFIL DEMOGRÁFICO
  // ---------------------------------------------------------------------------
  describe('Passo 2 - Perfil Demográfico (etapa2Schema) - FA-002', () => {
    it('deve aprovar perfil demográfico preenchido corretamente', () => {
      const dados = {
        raca: 'Branco',
        identificacaoSexual: 'Heterossexual',
        genero: 'Homem',
        transgenero: 'Não',
        temFilhos: false,
      };
      const res = etapa2Schema.safeParse(dados);
      expect(res.success).toBe(true);
    });

    it('deve recusar caso qualquer campo demográfico esteja em branco', () => {
      const dadosIncompletos = {
        raca: '',
        identificacaoSexual: 'Heterossexual',
        genero: 'Homem',
        transgenero: 'Não',
        temFilhos: false,
      };
      const res = etapa2Schema.safeParse(dadosIncompletos);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Selecione a raça');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // PASSO 3: CONTATO E VÍNCULO ACADÊMICO
  // ---------------------------------------------------------------------------
  describe('Passo 3 - Telefone / WhatsApp (telefoneSchema) - Issue #69', () => {
    it('deve aprovar telefone celular válido com 11 dígitos e DDD correto', () => {
      const res = telefoneSchema.safeParse('(88) 9 9999-8888');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('88999998888');
      }
    });

    it('deve recusar telefone com DDD inválido (ex: 00)', () => {
      const res = telefoneSchema.safeParse('(00) 9 9999-8888');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('DDD inválido');
      }
    });

    it('deve recusar número fixo (terceiro dígito diferente de 9)', () => {
      const res = telefoneSchema.safeParse('(88) 3 3333-3333');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('O celular deve começar com 9 depois do DDD');
      }
    });

    it('deve recusar número com todos os dígitos repetidos no corpo (ex: 88999999999)', () => {
      const res = telefoneSchema.safeParse('88999999999');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Número de telefone inválido');
      }
    });
  });

  describe('Passo 3 - Vínculo Acadêmico (etapa3Schema)', () => {
    it('deve aprovar dados de contato e vínculo acadêmico válidos', () => {
      const dados = {
        bairro: 'Centro',
        whatsapp: '(88) 9 9999-8888',
        instituicao: 'UFC - Universidade Federal do Ceará',
        curso: 'Engenharia de Software',
        campus: 'Quixadá',
        periodoIngresso: '2023.1',
        turno: 'Vespertino',
        semestreAtual: '8º',
      };
      const res = etapa3Schema.safeParse(dados);
      expect(res.success).toBe(true);
    });

    it('deve recusar caso a instituição ou o curso fiquem em branco', () => {
      const dadosIncompletos = {
        bairro: 'Centro',
        whatsapp: '(88) 9 9999-8888',
        instituicao: '',
        curso: 'Engenharia de Software',
        campus: 'Quixadá',
        periodoIngresso: '2023.1',
        turno: 'Vespertino',
        semestreAtual: '8º',
      };
      const res = etapa3Schema.safeParse(dadosIncompletos);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Selecione a instituição');
      }
    });

    it('deve recusar combinações matematicamente impossíveis entre período de ingresso e semestre atual (ex: 2024.1 com 10º semestre)', () => {
      const dadosImpossiveis = {
        bairro: 'Centro',
        whatsapp: '(88) 9 9999-8888',
        instituicao: 'UFC - Universidade Federal do Ceará',
        curso: 'Engenharia de Software',
        campus: 'Quixadá',
        periodoIngresso: '2024.1',
        turno: 'Vespertino',
        semestreAtual: '10º',
      };
      const res = etapa3Schema.safeParse(dadosImpossiveis);
      expect(res.success).toBe(false);
      if (!res.success) {
        const erroSemestre = res.error.issues.find((i) => i.path.includes('semestreAtual'));
        expect(erroSemestre).toBeDefined();
        expect(erroSemestre?.message).toContain('Semestre incompatível com o ingresso (2024.1)');
      }
    });

    it('deve aprovar combinações coerentes entre período de ingresso e semestre atual (ex: 2023.1 com 6º semestre)', () => {
      const dadosCoerentes = {
        bairro: 'Centro',
        whatsapp: '(88) 9 9999-8888',
        instituicao: 'UFC - Universidade Federal do Ceará',
        curso: 'Engenharia de Software',
        campus: 'Quixadá',
        periodoIngresso: '2023.1',
        turno: 'Vespertino',
        semestreAtual: '6º',
      };
      const res = etapa3Schema.safeParse(dadosCoerentes);
      expect(res.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // PASSO 4: DOCUMENTAÇÃO
  // ---------------------------------------------------------------------------
  describe('Passo 4 - Documentação (etapa4Schema) - Issues #64, #65', () => {
    it('deve aprovar arquivos nos formatos permitidos (PDF, PNG, JPG, WEBP) e até 10 MB', () => {
      const arquivoPdf = { name: 'comprovante.pdf', type: 'application/pdf', size: 2 * 1024 * 1024, uri: 'file:///path/doc.pdf' };
      const arquivoImg = { name: 'comprovante.jpg', type: 'image/jpeg', size: 1 * 1024 * 1024, uri: 'file:///path/img.jpg' };

      const res = etapa4Schema.safeParse({
        comprovanteMatricula: arquivoPdf,
        comprovanteResidencia: arquivoImg,
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar arquivos com tamanho superior a 10 MB', () => {
      const arquivoGigante = { name: 'comprovante.pdf', type: 'application/pdf', size: 15 * 1024 * 1024, uri: 'file:///doc.pdf' };
      const res = etapa4Schema.safeParse({
        comprovanteMatricula: arquivoGigante,
        comprovanteResidencia: arquivoGigante,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Envie PDF ou imagem (PNG, JPG ou WEBP) de até 10 MB');
      }
    });

    it('deve recusar formatos de arquivo não permitidos (ex: .exe, .zip)', () => {
      const arquivoExecutavel = { name: 'virus.exe', type: 'application/x-msdownload', size: 1024, uri: 'file:///virus.exe' };
      const res = etapa4Schema.safeParse({
        comprovanteMatricula: arquivoExecutavel,
        comprovanteResidencia: arquivoExecutavel,
      });
      expect(res.success).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // PASSO 5: TERMOS DE USO
  // ---------------------------------------------------------------------------
  describe('Passo 5 - Termos de Uso (etapa5Schema) - FA-003', () => {
    it('deve recusar a conclusão do cadastro sem o aceite explícito dos termos', () => {
      const res = etapa5Schema.safeParse({ aceitouTermos: false });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Você deve aceitar os termos de uso para continuar');
      }
    });

    it('deve aprovar quando os termos de uso forem aceitos', () => {
      const res = etapa5Schema.safeParse({ aceitouTermos: true });
      expect(res.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // SCHEMA COMPLETO INTEGRADO E OUTROS SCHEMAS
  // ---------------------------------------------------------------------------
  describe('Cadastro Completo Integrado (alunoSchema e renovacaoSchema)', () => {
    it('deve aprovar o objeto de cadastro completo contendo todos os dados válidos de todas as etapas', () => {
      const cadastroCompleto = {
        fotoPerfil: 'file:///foto.jpg',
        nomeCompleto: 'João Silva Neves',
        email: 'joao.neves@gmail.com',
        dataNascimento: '15/05/2002',
        senha: 'Aluno123Senha',
        confirmarSenha: 'Aluno123Senha',
        raca: 'Branco',
        identificacaoSexual: 'Heterossexual',
        genero: 'Homem',
        transgenero: 'Não',
        temFilhos: false,
        bairro: 'Centro',
        whatsapp: '(88) 9 9999-8888',
        instituicao: 'UFC - Universidade Federal do Ceará',
        curso: 'Engenharia de Software',
        campus: 'Quixadá',
        periodoIngresso: '2023.1',
        turno: 'Vespertino',
        semestreAtual: '8º',
        comprovanteMatricula: { name: 'matricula.pdf', type: 'application/pdf', size: 1024, uri: 'file:///mat.pdf' },
        comprovanteResidencia: { name: 'residencia.pdf', type: 'application/pdf', size: 1024, uri: 'file:///res.pdf' },
        aceitouTermos: true,
      };

      const res = alunoSchema.safeParse(cadastroCompleto);
      expect(res.success).toBe(true);
    });

    it('deve aprovar o schema de renovação de vínculo', () => {
      const renovacaoCompleta = {
        fotoPerfil: 'file:///foto.jpg',
        nomeCompleto: 'João Silva Neves',
        email: 'joao.neves@gmail.com',
        dataNascimento: '15/05/2002',
        raca: 'Branco',
        identificacaoSexual: 'Heterossexual',
        genero: 'Homem',
        transgenero: 'Não',
        temFilhos: false,
        bairro: 'Centro',
        whatsapp: '(88) 9 9999-8888',
        instituicao: 'UFC - Universidade Federal do Ceará',
        curso: 'Engenharia de Software',
        campus: 'Quixadá',
        periodoIngresso: '2023.1',
        turno: 'Vespertino',
        semestreAtual: '8º',
        comprovanteMatricula: { name: 'matricula.pdf', type: 'application/pdf', size: 1024, uri: 'file:///mat.pdf' },
      };

      const res = renovacaoSchema.safeParse(renovacaoCompleta);
      expect(res.success).toBe(true);
    });
  });

  describe('Outros Schemas (loginSchema e perfilSchema)', () => {
    it('deve validar login e esqueci senha', () => {
      expect(loginSchema.safeParse({ email: 'joao@email.com', senha: '123' }).success).toBe(true);
      expect(forgotPasswordSchema.safeParse({ email: 'joao@email.com' }).success).toBe(true);
      expect(resetPasswordSchema.safeParse({ novaSenha: 'Senha123Forte', confirmarNovaSenha: 'Senha123Forte' }).success).toBe(true);
    });

    it('deve validar editar perfil e alterar e-mail', () => {
      expect(editarPerfilSchema.safeParse({ telefone: '88999998888', bairro: 'Centro' }).success).toBe(true);
      expect(alterarEmailSchema.safeParse({ emailAtual: 'antigo@email.com', novoEmail: 'novo@email.com', senhaAtual: 'Senha123' }).success).toBe(true);
    });
  });
});
