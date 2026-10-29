import { bairroService } from './bairroService';
import { faculdadeService } from './faculdadeService';

export async function carregarVinculosAtivos() {
  const [bairros, faculdades] = await Promise.all([
    bairroService.listarBairros(),
    faculdadeService.listarFaculdades(),
  ]);

  return {
    bairros: bairros.filter((bairro) => bairro.ativo),
    faculdades: faculdades.filter((faculdade) => faculdade.ativo),
  };
}

export async function validarVinculosAluno(bairro: string, instituicao: string) {
  if (!/^[1-9]\d*$/.test(bairro)) {
    throw new Error('Selecione um bairro cadastrado e ativo.');
  }
  if (!/^[1-9]\d*$/.test(instituicao)) {
    throw new Error('Selecione uma instituição cadastrada e ativa.');
  }

  // Revalida antes do envio: um vínculo pode ter sido inativado após a seleção.
  const { bairros, faculdades } = await carregarVinculosAtivos();
  if (!bairros.some((item) => String(item.id) === bairro)) {
    throw new Error('O bairro selecionado não está disponível. Selecione outro bairro ativo.');
  }
  if (!faculdades.some((item) => String(item.id) === instituicao)) {
    throw new Error('A instituição selecionada não está disponível. Selecione outra instituição ativa.');
  }

  return { bairroId: bairro, faculdadeId: instituicao };
}
