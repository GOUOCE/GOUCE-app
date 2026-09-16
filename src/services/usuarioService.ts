import { api } from '../api/api';
import { AlunoFormData } from '../../frontend/src/schemas/alunoSchema';
import { LoginResponse } from './authService';

export const usuarioService = {
  async cadastrar(data: AlunoFormData): Promise<LoginResponse> {
    const formData = new FormData();

    // Dados básicos
    formData.append('nome', data.nomeCompleto);
    formData.append('email', data.email);
    formData.append('senha', data.senha);
    formData.append('data_nascimento', data.dataNascimento);
    formData.append('termos_de_uso', String(data.aceitouTermos));

    // Perfil demográfico
    formData.append('raca', data.raca);
    formData.append('identificacao_sexual', data.identificacaoSexual);
    formData.append('identificacao_genero', data.genero);
    formData.append('transgenero', data.transgenero);
    formData.append('tem_filhos', String(data.temFilhos));

    // Contato e Vínculo
    formData.append('telefone', data.whatsapp);
    formData.append('bairro_id', data.bairro);
    formData.append('faculdade_id', data.instituicao);
    formData.append('curso', data.curso);
    formData.append('campus', data.campus);
    formData.append('periodo_ingresso', data.periodoIngresso);
    formData.append('turno_curso', data.turno);
    formData.append('semestre_atual', data.semestreAtual.replace('º', '')); // Removendo o caractere ordinal se houver

    // Documentação (Arquivos)
    if (data.comprovanteMatricula) {
      formData.append('comprovante_matricula', {
        uri: data.comprovanteMatricula.uri,
        name: data.comprovanteMatricula.name || 'comprovante_matricula.pdf',
        type: data.comprovanteMatricula.mimeType || 'application/pdf',
      } as any);
    }

    if (data.comprovanteResidencia) {
      formData.append('comprovante_residencia', {
        uri: data.comprovanteResidencia.uri,
        name: data.comprovanteResidencia.name || 'comprovante_residencia.pdf',
        type: data.comprovanteResidencia.mimeType || 'application/pdf',
      } as any);
    }

    // Foto de perfil se houver
    if (data.fotoPerfil) {
      // O backend parece esperar id_foto_aluno como string (UUID),
      // mas se estivermos fazendo upload direto aqui, poderíamos precisar de outro endpoint
      // ou o backend precisaria suportar o arquivo da foto.
      // Por enquanto, vamos assumir que id_foto_aluno é preenchido após upload ou ignorado.
      // formData.append('foto_perfil', ...);
    }

    const response = await api.post<LoginResponse>('/usuarios/cadastrar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },
};
