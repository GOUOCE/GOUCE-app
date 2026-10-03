import { describe, expect, it } from '@jest/globals';
import { getErrorMessage } from '../errorUtils';

// Testes iniciais para o CI ter uma base no front. Os testes das validações
// de formulário (schemas) ficam a cargo do time de front.

const respostaApi = (data: unknown) => ({ response: { data } });

describe('getErrorMessage', () => {
  describe('sem resposta da API', () => {
    it('informa erro de conexão quando a requisição não chega ao servidor', () => {
      expect(getErrorMessage({ message: 'Network Error' })).toBe(
        'Erro de conexão com o servidor. Verifique sua internet ou tente novamente em instantes.',
      );
    });

    it('usa a mensagem do erro quando ela existe', () => {
      expect(getErrorMessage({ message: 'Tempo esgotado' })).toBe('Tempo esgotado');
    });

    it('usa a mensagem padrão quando o erro não tem mensagem', () => {
      expect(getErrorMessage({}, 'Falhou')).toBe('Falhou');
    });
  });

  describe('códigos de erro conhecidos', () => {
    it('traduz e-mail já cadastrado', () => {
      const erro = respostaApi({ error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'E-mail já cadastrado no sistema' } });
      expect(getErrorMessage(erro)).toBe('Este e-mail já está cadastrado na plataforma GOUOCE.');
    });

    it('traduz conflito de cadastro', () => {
      const erro = respostaApi({ error: { code: 'REGISTRATION_CONFLICT' } });
      expect(getErrorMessage(erro)).toContain('Já existe um cadastro ativo');
    });
  });

  describe('formatos de resposta da API', () => {
    it('junta as mensagens de { detail: { erros: [...] } }', () => {
      const erro = respostaApi({ detail: { erros: ['Turno inválido', 'Curso obrigatório'] } });
      expect(getErrorMessage(erro)).toBe('Turno inválido\nCurso obrigatório');
    });

    it('usa as mensagens de { error: { details: [...] } }', () => {
      const erro = respostaApi({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos',
          details: [{ field: 'nome', message: 'Nome completo deve ter pelo menos 3 caracteres' }],
        },
      });
      expect(getErrorMessage(erro)).toBe('Nome completo deve ter pelo menos 3 caracteres');
    });

    it('formata o 422 padrão do FastAPI com o nome do campo', () => {
      const erro = respostaApi({ detail: [{ loc: ['body', 'email'], msg: 'value is not a valid email address' }] });
      expect(getErrorMessage(erro)).toBe('email: value is not a valid email address');
    });

    it('usa { detail: "..." } quando é texto', () => {
      expect(getErrorMessage(respostaApi({ detail: 'Acesso negado' }))).toBe('Acesso negado');
    });

    it('usa error.message quando não há detalhes', () => {
      expect(getErrorMessage(respostaApi({ error: { message: 'Não autorizado' } }))).toBe('Não autorizado');
    });

    it('usa a mensagem padrão para um corpo desconhecido', () => {
      expect(getErrorMessage(respostaApi({}), 'Erro genérico')).toBe('Erro genérico');
    });
  });

  it('sempre devolve texto, nunca um objeto ("[object Object]")', () => {
    const formatos = [
      { detail: { erros: ['a'] } },
      { error: { details: [{ field: 'x', message: 'b' }] } },
      { detail: [{ loc: ['body', 'y'], msg: 'c' }] },
      { detail: 'd' },
      { error: { message: 'e' } },
      {},
    ];
    for (const data of formatos) {
      const mensagem = getErrorMessage(respostaApi(data));
      expect(typeof mensagem).toBe('string');
      expect(mensagem).not.toContain('[object Object]');
    }
  });
});
