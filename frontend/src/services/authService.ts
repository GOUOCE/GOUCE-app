import { api } from '../api/api';
import { LoginFormData, ForgotPasswordFormData, ResetPasswordFormData } from '@/schemas/loginSchema';
import { UserRole } from '../contexts/AuthContext';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: string;
  telefone?: string;
  curso?: string;
  faculdade?: string;
  periodo_ingresso?: string;
  turno?: string;
  foto_perfil?: string;
}

export interface LoginResponse {
  token_acesso: string;
  token_atualizacao: string;
  tipo_token: string;
  usuario: {
    id: number;
    nome: string;
    email: string;
    role: string;
    status_cadastro?: string;
    nome_completo?: string;
    telefone?: string;
    curso?: string;
    faculdade?: string;
    periodo_ingresso?: string;
    turno?: string;
    foto_perfil?: string;
  };
}

const mapRole = (role: string): UserRole => {
  switch (role.toLowerCase()) {
    case 'aluno':
      return 'ALUNO';
    case 'administrador':
      return 'ADMINISTRADOR';
    case 'supervisor':
      return 'MOTORISTA'; // Mapeando supervisor para motorista/representante por enquanto
    default:
      return 'ALUNO';
  }
};

export const authService = {
  async login(data: LoginFormData & { lembrar_me?: boolean }): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', {
      email: data.email,
      senha: data.senha,
      lembrar_me: data.lembrar_me || false,
    });
    return response.data;
  },

  async forgotPassword(data: ForgotPasswordFormData): Promise<void> {
    await api.post('/auth/solicitar-recuperacao', {
      email: data.email
    }, { timeout: 10000 }); // 10 segundos de limite
  },

  async resetPassword(data: ResetPasswordFormData, token: string): Promise<void> {
    await api.post('/auth/redefinir-senha', {
      token: token,
      nova_senha: data.novaSenha,
    });
  },

  mapRole,
};
