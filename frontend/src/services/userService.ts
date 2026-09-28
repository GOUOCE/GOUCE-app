import { api } from '../api/api';
import { AlunoFormData } from '@/schemas/alunoSchema';

export interface CadastroResponse {
  success: true;
  message: string;
  data: {
    id: number;
    nome: string;
    email: string;
    status_cadastro: 'pendente';
  };
}

/**
 * Converte com segurança qualquer tipo de objeto de arquivo (DocumentPicker, ImagePicker ou URI string)
 * em uma estrutura válida aceita pelo FormData do React Native ({ uri, name, type }).
 */
function buildFilePart(file: any, defaultName: string, defaultType: string) {
  if (!file) return null;

  // Trata caso onde file seja um array ou contenha 'assets'
  const target = Array.isArray(file) ? file[0] : (file && file.assets && file.assets[0]) ? file.assets[0] : file;

  if (!target) return null;

  const uri = typeof target === 'string' ? target : target.uri;
  if (!uri || typeof uri !== 'string') return null;

  const name = (typeof target === 'object' && target.name) ? target.name : defaultName;
  const type = (typeof target === 'object' && (target.mimeType || target.type)) ? (target.mimeType || target.type) : defaultType;

  return {
    uri,
    name,
    type,
  };
}

export const userService = {
  async register(data: AlunoFormData): Promise<CadastroResponse> {
    const formData = new FormData();

    // Dados básicos
    const formatarDataParaISO = (dataStr: string) => {
      const partes = (dataStr || '').split('/');
      if (partes.length !== 3) return dataStr || '';
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    };

    formData.append('nome', String(data.nomeCompleto || ''));
    formData.append('email', String(data.email || ''));
    formData.append('senha', String(data.senha || ''));
    formData.append('data_nascimento', String(formatarDataParaISO(data.dataNascimento)));
    formData.append('telefone', String(data.whatsapp || ''));

    // Perfil Demográfico
    formData.append('raca', String(data.raca || ''));
    formData.append('identificacao_sexual', String(data.identificacaoSexual || ''));
    formData.append('identificacao_genero', String(data.genero || ''));
    formData.append('transgenero', String(data.transgenero || ''));
    formData.append('tem_filhos', String(Boolean(data.temFilhos)));

    formData.append('bairro_id', String(data.bairro || ''));
    formData.append('faculdade_id', String(data.instituicao || ''));
    formData.append('curso', String(data.curso || ''));

    const semestre = String(data.semestreAtual || '').replace(/[^0-9]/g, '');
    if (semestre) {
      formData.append('semestre_atual', semestre);
    }

    // Trata o período de ingresso para garantir formato AAAA.S esperado pelo backend
    let periodoIngresso = String(data.periodoIngresso || '');
    if (periodoIngresso === 'Anterior') {
      const anoAnterior = new Date().getFullYear() - 4;
      periodoIngresso = `${anoAnterior}.1`;
    }
    formData.append('periodo_ingresso', periodoIngresso);

    formData.append('turno_curso', String(data.turno || ''));

    // Documentação (Arquivos do expo-document-picker ou expo-image-picker)
    const matPart = buildFilePart(data.comprovanteMatricula, 'comprovante_matricula.pdf', 'application/pdf');
    if (matPart) {
      formData.append('comprovante_matricula', matPart as any);
    }

    const resPart = buildFilePart(data.comprovanteResidencia, 'comprovante_residencia.pdf', 'application/pdf');
    if (resPart) {
      formData.append('comprovante_residencia', resPart as any);
    }

    const fotoPart = buildFilePart(data.fotoPerfil, 'foto_perfil.jpg', 'image/jpeg');
    if (fotoPart) {
      formData.append('foto_perfil', fotoPart as any);
    }

    formData.append('termos_de_uso', String(Boolean(data.aceitouTermos)));

    console.log('[DEBUG] FormData partes:', JSON.stringify((formData as any)._parts, null, 2));

    try {
      console.log('[DEBUG] Enviando via api.postForm...');
      const response = await api.postForm<CadastroResponse>('/usuarios/cadastrar', formData, {
        timeout: 25000,
      });
      return response.data;
    } catch (apiError: any) {
      console.warn('[DEBUG] api.postForm falhou, tentando fallback via fetch nativo...', apiError?.message);

      const endpoint = (api.defaults.baseURL || 'http://localhost:8000') + '/usuarios/cadastrar';
      const fetchResponse = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const resultText = await fetchResponse.text();
      let jsonResult: any;
      try {
        jsonResult = JSON.parse(resultText);
      } catch {
        jsonResult = { message: resultText };
      }

      if (!fetchResponse.ok) {
        const errorMsg =
          jsonResult?.error?.message ||
          (jsonResult?.error?.details && Array.isArray(jsonResult.error.details)
            ? jsonResult.error.details.map((d: any) => (typeof d === 'string' ? d : d.message || JSON.stringify(d))).join('\n')
            : null) ||
          jsonResult?.detail?.erros?.join('\n') ||
          (typeof jsonResult?.detail === 'string' ? jsonResult.detail : null) ||
          'Erro ao realizar cadastro.';

        const error: any = new Error(errorMsg);
        error.response = {
          status: fetchResponse.status,
          data: jsonResult,
        };
        throw error;
      }

      return jsonResult as CadastroResponse;
    }
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

  async getProfile(): Promise<any> {
    const response = await api.get('/usuarios/me');
    return response.data;
  },

  async updateProfile(data: { telefone?: string; bairro_id?: string }): Promise<any> {
    const response = await api.patch('/usuarios/me', data);
    return response.data;
  },

  async updateEmail(data: { novo_email: string; senha_atual: string }): Promise<any> {
    const response = await api.patch('/usuarios/me/email', {
      novo_email: data.novo_email,
      senha: data.senha_atual,
    });
    return response.data;
  },
};
