import { api } from '../api/api';
import { AlunoFormData } from '@/schemas/alunoSchema';
import { LoginResponse } from './authService';

export const userService = {
  async register(data: AlunoFormData): Promise<LoginResponse> {
    const formData = new FormData();

    // Dados básicos
    // Converte data de DD/MM/YYYY para YYYY-MM-DD para o backend
    const formatarDataParaISO = (dataStr: string) => {
      const partes = dataStr.split('/');
      if (partes.length !== 3) return dataStr;
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    };

    formData.append('nome', data.nomeCompleto);
    formData.append('email', data.email);
    formData.append('senha', data.senha);
    formData.append('data_nascimento', formatarDataParaISO(data.dataNascimento));
    formData.append('telefone', data.whatsapp);

    // Perfil Demográfico
    formData.append('raca', data.raca);
    formData.append('identificacao_sexual', data.identificacaoSexual);
    formData.append('identificacao_genero', data.genero);
    formData.append('transgenero', data.transgenero);
    formData.append('tem_filhos', String(data.temFilhos));

    // Contato e Vínculo
    formData.append('bairro_id', data.bairro);
    formData.append('faculdade_id', data.instituicao);
    formData.append('curso', data.curso);
    formData.append('semestre_atual', String(data.semestreAtual).replace(/[^0-9]/g, ''));
    formData.append('periodo_ingresso', data.periodoIngresso);
    formData.append('turno_curso', data.turno);

    // Documentação (Arquivos do expo-document-picker)
    if (data.comprovanteMatricula) {
      const file = data.comprovanteMatricula;
      formData.append('comprovante_matricula', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);
    }

    if (data.comprovanteResidencia) {
      const file = data.comprovanteResidencia;
      formData.append('comprovante_residencia', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);
    }

    formData.append('termos_de_uso', String(data.aceitouTermos));

    console.log('[DEBUG] Enviando cadastro para:', api.defaults.baseURL + '/usuarios/cadastrar');

    const response = await api.post<LoginResponse>('/usuarios/cadastrar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 15000, // 15 segundos para dar tempo do upload
    });

    return response.data;
  },

  async verificarEmail(email: string): Promise<boolean> {
    try {
      const response = await api.get<{ existe: boolean }>(`/usuarios/verificar-email/${email}`);
      return response.data.existe;
    } catch (error) {
      console.error('Erro ao verificar e-mail:', error);
      return false;
    }
  },
};
