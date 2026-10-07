import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

import { authService } from '../authService';

describe('Suíte de Testes Unitários - HU-003 (Mapeamento de Perfis e Autenticação)', () => {
  describe('mapRole (Controle de Acesso por Perfil)', () => {
    it('deve mapear corretamente o cargo "aluno" para "ALUNO"', () => {
      expect(authService.mapRole('aluno')).toBe('ALUNO');
      expect(authService.mapRole('ALUNO')).toBe('ALUNO');
    });

    it('deve mapear corretamente o cargo "administrador" para "ADMINISTRADOR"', () => {
      expect(authService.mapRole('administrador')).toBe('ADMINISTRADOR');
      expect(authService.mapRole('ADMINISTRADOR')).toBe('ADMINISTRADOR');
    });

    it('deve mapear corretamente o cargo "supervisor" ou "representante" para "MOTORISTA"', () => {
      expect(authService.mapRole('supervisor')).toBe('MOTORISTA');
      expect(authService.mapRole('representante')).toBe('MOTORISTA');
    });

    it('deve mapear cargos desconhecidos para "ALUNO" por segurança', () => {
      expect(authService.mapRole('outro_cargo_desconhecido')).toBe('ALUNO');
    });
  });
});
