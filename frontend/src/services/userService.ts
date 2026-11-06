import { api } from '../api/api';
import { AlunoFormData } from '@/schemas/alunoSchema';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { validarVinculosAluno } from './vinculoAlunoService';

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
function buildFilePart(file: any, defaultName: string, defaultType: string): ParteArquivo | null {
  if (!file) return null;

  // Trata caso onde file seja um array ou contenha 'assets'
  const target = Array.isArray(file) ? file[0] : (file && file.assets && file.assets[0]) ? file.assets[0] : file;

  if (!target) return null;

  const uri = typeof target === 'string' ? target : target.uri;
  if (!uri || typeof uri !== 'string') return null;

  // Se o URI for um marcador como 'existente' ou não tiver prefixo de arquivo válido
  if (
    uri === 'existente' ||
    (!uri.startsWith('file:') &&
     !uri.startsWith('content:') &&
     !uri.startsWith('http:') &&
     !uri.startsWith('https:') &&
     !uri.startsWith('data:') &&
     !uri.startsWith('blob:'))
  ) {
    return null;
  }

  const name = (typeof target === 'object' && target.name) ? target.name : defaultName;
  const type = (typeof target === 'object' && (target.mimeType || target.type)) ? (target.mimeType || target.type) : defaultType;

  // Na web o seletor devolve também o File escolhido (blob:), que é o que o FormData aceita
  const arquivoWeb = typeof target === 'object' && target.file ? target.file : undefined;

  return {
    uri,
    name,
    type,
    ...(arquivoWeb ? { file: arquivoWeb } : {}),
  };
}

type ParteArquivo = { uri: string; name: string; type: string; file?: Blob };

/**
 * Anexa o arquivo ao FormData. No celular o React Native aceita { uri, name, type }; na web o FormData só
 * aceita File/Blob e o mesmo objeto viraria texto, deixando o campo sem arquivo na API (#192).
 */
async function anexarArquivo(formData: FormData, campo: string, parte: ParteArquivo | null) {
  if (!parte) return;
  if (Platform.OS === 'web') {
    const arquivo = parte.file ?? (await (await fetch(parte.uri)).blob());
    formData.append(campo, arquivo, parte.name);
    return;
  }
  formData.append(campo, parte as any);
}

/**
 * Envia um objeto FormData utilizando a ponte nativa XMLHttpRequest do React Native.
 * Bypassa a limitação do polyfill 'fetch' do Expo (winter/fetch) que lança 'Unsupported FormDataPart implementation' para objetos { uri, name, type }.
 */
function sendFormDataViaXHR(url: string, method: 'POST' | 'PUT', formData: FormData, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onload = () => {
      let responseData: any;
      try {
        responseData = JSON.parse(xhr.responseText);
      } catch {
        responseData = { message: xhr.responseText };
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(responseData);
      } else {
        let errorMsg =
          responseData?.error?.message ||
          (responseData?.error?.details && Array.isArray(responseData.error.details)
            ? responseData.error.details.map((d: any) => (typeof d === 'string' ? d : d.message || JSON.stringify(d))).join('\n')
            : null) ||
          responseData?.detail?.erros?.join('\n');

        if (!errorMsg && Array.isArray(responseData?.detail)) {
          errorMsg = responseData.detail
            .map((err: any) => {
              const field = Array.isArray(err.loc) ? err.loc.slice(-1)[0] : '';
              return field ? `${field}: ${err.msg}` : err.msg || JSON.stringify(err);
            })
            .join('\n');
        }

        if (!errorMsg && typeof responseData?.detail === 'string') {
          errorMsg = responseData.detail;
        }

        if (!errorMsg) {
          errorMsg = 'Dados de cadastro inválidos ou incompletos. Verifique os campos.';
        }

        const error: any = new Error(errorMsg);
        error.response = { status: xhr.status, data: responseData };
        reject(error);
      }
    };

    xhr.onerror = () => {
      const error: any = new Error('Erro de conexão com o servidor. Verifique sua internet.');
      reject(error);
    };

    xhr.ontimeout = () => {
      const error: any = new Error('Tempo limite da requisição excedido.');
      reject(error);
    };

    xhr.timeout = 30000;
    xhr.send(formData);
  });
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

    const { bairroId, faculdadeId } = await validarVinculosAluno(data.bairro, data.instituicao);
    const cursoFinal = data.curso === 'Outro' && data.cursoEspecifico ? data.cursoEspecifico : data.curso;

    formData.append('bairro_id', bairroId);
    formData.append('faculdade_id', faculdadeId);
    formData.append('curso', String(cursoFinal || ''));
    formData.append('campus', String(data.campus || 'Quixadá'));

    const semestre = String(data.semestreAtual || '').replace(/[^0-9]/g, '');
    if (semestre) {
      formData.append('semestre_atual', semestre);
    }

    formData.append('periodo_ingresso', String(data.periodoIngresso || ''));

    formData.append('turno_curso', String(data.turno || ''));

    // Documentação (Arquivos do expo-document-picker ou expo-image-picker)
    await anexarArquivo(formData, 'comprovante_matricula', buildFilePart(data.comprovanteMatricula, 'comprovante_matricula.pdf', 'application/pdf'));
    await anexarArquivo(formData, 'comprovante_residencia', buildFilePart(data.comprovanteResidencia, 'comprovante_residencia.pdf', 'application/pdf'));
    await anexarArquivo(formData, 'foto_perfil', buildFilePart(data.fotoPerfil, 'foto_perfil.jpg', 'image/jpeg'));

    formData.append('termos_de_uso', String(Boolean(data.aceitouTermos)));

    const endpoint = (api.defaults.baseURL || 'http://localhost:8000') + '/usuarios/cadastrar';
    console.log('[DEBUG] Enviando cadastro via XMLHttpRequest para:', endpoint);

    return await sendFormDataViaXHR(endpoint, 'POST', formData);
  },

  async renovarVinculo(data: AlunoFormData): Promise<any> {
    const formData = new FormData();

    formData.append('nome', String(data.nomeCompleto || ''));
    formData.append('raca', String(data.raca || ''));
    formData.append('identificacao_sexual', String(data.identificacaoSexual || ''));
    formData.append('identificacao_genero', String(data.genero || ''));
    formData.append('transgenero', String(data.transgenero || ''));
    formData.append('tem_filhos', String(Boolean(data.temFilhos)));

    const { bairroId, faculdadeId } = await validarVinculosAluno(data.bairro, data.instituicao);
    const cursoFinal = data.curso === 'Outro' && data.cursoEspecifico ? data.cursoEspecifico : data.curso;

    formData.append('telefone', String(data.whatsapp || ''));
    formData.append('bairro_id', bairroId);
    formData.append('faculdade_id', faculdadeId);
    formData.append('curso', String(cursoFinal || ''));
    formData.append('campus', String(data.campus || 'Quixadá'));

    formData.append('periodo_ingresso', String(data.periodoIngresso || ''));

    formData.append('turno_curso', String(data.turno || ''));

    const semestre = String(data.semestreAtual || '').replace(/[^0-9]/g, '');
    formData.append('semestre_atual', semestre || '1');

    // Documentação
    await anexarArquivo(formData, 'comprovante_matricula', buildFilePart(data.comprovanteMatricula, 'comprovante_matricula.pdf', 'application/pdf'));

    const resPart = buildFilePart(data.comprovanteResidencia, 'comprovante_residencia.pdf', 'application/pdf');
    if (resPart) {
      await anexarArquivo(formData, 'comprovante_residencia', resPart);
    } else {
      // Se não enviou novo comprovante de residência na renovação, passa string vazia para o FastAPI manter o atual sem estourar erro de URI no React Native
      formData.append('comprovante_residencia', '');
    }

    // A foto atual vem como URL do servidor; só envia quando o aluno escolheu uma nova
    const fotoPart = buildFilePart(data.fotoPerfil, 'foto_perfil.jpg', 'image/jpeg');
    if (fotoPart && !/^https?:/i.test(fotoPart.uri)) {
      await anexarArquivo(formData, 'foto_perfil', fotoPart);
    }

    const endpoint = (api.defaults.baseURL || 'http://localhost:8000') + '/alunos/renovar-vinculo';
    const token = await AsyncStorage.getItem('@GOUOCE:token');

    console.log('[DEBUG] Enviando renovação via XMLHttpRequest para:', endpoint);
    return await sendFormDataViaXHR(endpoint, 'PUT', formData, token || undefined);
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

  async getCarteirinha(): Promise<any> {
    const response = await api.get('/alunos/me/carteirinha');
    return response.data;
  },

  async reenviarDocumentos(data: FormData): Promise<any> {
    const response = await api.patch('/usuarios/me/reenviar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
